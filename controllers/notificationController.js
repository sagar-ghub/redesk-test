const Notification = require("../models/notification");

exports.getNotification = async (req, res) => {
  const id = req.params.user_id;
  try {
    const result = await Notification.find({ send_to: id }).select({
      _id: 0,
      status: 0,
      send_to: 0,
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
    });

    if (result.length == 0) {
      return res.status(200).send({
        status: 200,
        message: "No notification to read",
      });
    }

    await Notification.updateMany(
      { send_to: id },
      {
        $set: {
          status: "READ",
        },
      }
    );
    return res.status(200).send({
      status: 200,
      result,
    });
  } catch (err) {
    return res.status(400).send({
      status: 400,
      message: "Error",
    });
  }
};
