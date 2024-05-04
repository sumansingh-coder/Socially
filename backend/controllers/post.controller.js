import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);

    if (!user) return res.status(400).json({ message: "User not found" });
    if (!text && !img)
      return res.status(400).json({ message: "Post must have text and img" });
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    res.status(201).json({ newPost, message: "New Post created" });
  } catch (error) {
    console.log("Error in createPost Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(400).json({ message: "Post not Found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Sorry you're not authorized to delete this post!" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }
    await Post.findByIdAndDelete(req.params.id);

    return res.status(400).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in DeletePost Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ message: "Text field is required" });
    }
    const post = await Post.findById(postId);

    if (!post) return res.status(400).json({ message: "Post Not Found" });

    const comment = { user: userId, text: text };

    post.comments.push(comment);
    await post.save();
    return res.status(200).json({ post, message: "Comment Successful" });
  } catch (error) {
    console.log("Error in commentOnPost Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) return res.status(400).json({ message: "Post Not Found" });

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      //Unlike
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPost: postId } });
      res.status(200).json({ message: "Post Unliked Successfully" });
    } else {
      //Like
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPost: postId } });
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });

      await notification.save();

      return res.status(200).json({ post, message: "Post liked Successfully" });
    }
  } catch (error) {
    console.log("Error in likeUnlikePost Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getAllPost Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User not found" });

    const likedPost = await Post.find({
      _id: { $in: user.likedPost },
    })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(likedPost);
  } catch (error) {
    console.log("Error in getLikedPosts Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const following = user.followings;
    const feedPosts = await Post.find({ user: { $in: followings } })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });
    res.status(200).json({ feedPosts, message: "Latest Post" });
  } catch (error) {
    console.log("Error in getFollowingPosts Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username });
    if (!user) return res.status(404).json({ message: "User not found" });
    const feedPosts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });
    res.status(200).json({ feedPosts, message: "My Latest Post" });
  } catch (error) {
    console.log("Error in getUserPosts Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
