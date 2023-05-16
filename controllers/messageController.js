const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const User = require("../models/user");
exports.allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "firstName lastName pic email")
      .populate("chat");

    return res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error });
    throw new Error(error.message);
  }
};

exports.sendMessage = async (req, res) => {
  let { content, chatId, contentType } = req.body;

  // if (!content || !chatId) {
  //   console.log("Invalid data passed into request");
  //   return res.sendStatus(400);
  // }
  // console.log(req.body);

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    contentType: contentType,
  };

  if (req.files && req.files.file) {
    chatId = JSON.parse(chatId);
    newMessage.chat = chatId;
    newMessage.contentType = req.files.file.mimetype;
    // newMessage.file = req.files.file.data;

    req.files.file.mv(
      `${__dirname}/../public/images/${req.files.file.name}`,
      (err) => {
        console.log(err);
      }
    );
    newMessage.file = `/images/${req.files.file.name}`;
  }

  // console.log(newMessage);

  try {
    var message = await Message.create(newMessage);

    message = await message
      .populate("sender", "firstName lastName pic email")
      .execPopulate();
    message = await message.populate("chat").execPopulate();
    // console.log(message);
    message = await User.populate(message, {
      path: "chat.users",
      select: "firstName lastName pic email",
    });

    // console.log(message);
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    return res.json(message);
  } catch (error) {
    res.status(400).json({ message: error });
    throw new Error(error.message);
  }
};
