const TaskModel = require("../models/task");
const Notification = require("../models/notification");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

//create task
exports.createTask = (req, res) => {
  let payload = req.body;
  let user = req.user;

  // create task_no
  const d = new Date();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  TaskModel.countDocuments(
    {
      createdAt: {
        $gte: new Date(year, month - 1, 1), // Start of the month
        $lt: new Date(year, month, 1), // Start of next month
      },
    },
    (err, result) => {
      if (err) {
        return res.status(500).send({
          status: "500",
          message: "Unable to create task.",
        });
      } else {
        const taskNo = result + 1;
        const reference_id =
          "TASK" +
          (d.getYear() - 100) +
          ("0" + month).slice(-2) +
          "" +
          String(taskNo).padStart(5, "0");

        payload.task_no = reference_id;
        payload.organisation = user.organisation;

        TaskModel.create(payload)
          .then((task) => {
            if (task) {
              payload.task_assignee.forEach((element) => {
                Notification.create({
                  notification: "New Task assigned",
                  status: "UNREAD",
                  send_by: user._id,
                  send_to: element,
                });
              });

              // const tasks=TaskM

              return res.status(201).send({
                status: "201",
                message: "Successfully added Task",
                // task,
              });
            }
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).send({
              status: "500",
              message: "Unable to create task. Try again later",
            });
          });
      }
    }
  );
};
//task list
exports.getTask = (req, res) => {
  const user = req.user;
  TaskModel.find({ organisation: user.organisation })
    .populate("project_id project_assignee ", "project_name firstName lastName")
    .exec((err, docs) => {
      if (!err) {
        return res
          .status(200)
          .send({ status: "200", message: "Task List", docs });
      } else {
        return res.status(500).send({
          status: "500",
          message: "Failed to retrieve the task List. Try again later",
        });
      }
    });
};
exports.getTaskByProject = (req, res) => {
  const projectId = { project_id: req.params.id };
  TaskModel.find(projectId)
    .populate("project_id task_assignee ", "project_name firstName lastName")
    .exec((err, docs) => {
      if (!err) {
        return res
          .status(200)
          .send({ status: "200", message: "Task List", docs });
      } else {
        return res.status(500).send({
          status: "500",
          message: "Failed to retrieve the task List. Try again later",
        });
      }
    });
};
exports.getTaskById = (req, res) => {
  const task_id = { _id: req.params.id };
  TaskModel.findOne(task_id, (err, docs) => {
    if (!err) {
      return res.status(200).send({ status: "200", message: "Task", docs });
    } else {
      return res.status(500).send({
        status: "500",
        message: "Failed to retrieve the task . Try again later",
      });
    }
  });
};
//task edit
exports.editTask = (req, res) => {
  const condition = { _id: req.params.id };
  TaskModel.updateOne(condition, req.body)
    .then((docs) => {
      if (!docs) {
        return res.status(400).send({
          status: "400",
          message: "Failed to Update. Try again later",
        });
      }
      return res
        .status(200)
        .send({ status: "200", message: "Succesffully Updated Task" });
    })
    .catch((err) => {
      return res.status(500).send({
        status: 500,
        message: "Failed to update. Try again later",
      });
    });
};

exports.closeTask = async (req, res) => {
  try {
    const _id = req.params.id;
    const result = await TaskModel.findByIdAndUpdate(_id, {
      $set: { task_labels: "FIXED" },
    });

    if (result.task_labels === "FIXED") {
      return res.status(200).send({
        status: 200,
        message: "Task Completed",
      });
    }

    return res.status(400).send({
      status: 400,
      message: "Failed to update. Try again later",
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to update. Try again later",
    });
  }
};

exports.changeTaskStatus = (req, res) => {
  const condition = { _id: req.params.id };
  // console.log(req.body.status);
  const status = parseInt(req.body.status);

  if (status >= 6) {
    return res
      .status(400)
      .send({ status: "400", message: "Failed to Update Task" });
  }
  // let newRole = config.task_status[status];
  // console.log(newRole);
  TaskModel.findOneAndUpdate(condition, { task_status: status })
    .then((docs) => {
      if (!docs) {
        return res
          .status(400)
          .send({ status: "400", message: "Failed to Task Update" });
      }
      return res
        .status(200)
        .send({ status: "200", message: "Succesffully Updated Task" });
    })
    .catch((err) => {
      return res
        .status(400)
        .send({ status: "400", message: "Something went wrong", err });
    });
};

// task reminder route
exports.reminderTask = async (req, res) => {
  const _id = req.params.id;
  try {
    const result = await TaskModel.findById(_id);
    // const decode_token = jwt.verify(req.cookies.token, process.env.SECRET);

    result.task_assignee.forEach((element) => {
      if (user._id != element) {
        Notification.create({
          notification: "Please complete the task immediately",
          status: "UNREAD",
          send_by: user._id,
          send_to: element,
        });
      }
    });

    return res.status(200).send({
      status: 200,
      message: "Notification send",
    });
  } catch (err) {
    return res.status(500).send({
      status: 500,
      message: "Try again later",
    });
  }
};
