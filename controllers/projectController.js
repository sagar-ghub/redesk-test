const projectModel = require("../models/project");
const taskModel = require("../models/task");
exports.createProject = async (req, res) => {
  const user = req.user;
  req.body.createdBy = user._id;
  req.body.organisation = user.organisation;

  const d = new Date();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  const projectCount = await projectModel.countDocuments({
    createdAt: {
      $gte: new Date(year, month - 1, 1), // Start of the month
      $lt: new Date(year, month, 1), // Start of next month
    },
  });
  // console.log(month);
  // console.log(projectCount);
  // return;

  const project_no = projectCount + 1;
  const reference_id =
    "RKIT" +
    (d.getYear() - 100) +
    ("0" + month).slice(-2) +
    "" +
    String(project_no).padStart(5, "0");

  console.log(reference_id);
  req.body.project_no = reference_id;
  // if (user.role == "admin") {
  if (true) {
    projectModel
      .create(req.body)
      .then((project) => {
        if (project) {
          return res
            .status(200)
            .send({ status: "200", message: "Successfully added Project" });
        }
      })
      .catch((err) => {
        return res
          .status(500)
          .send({ status: "500", message: "Unable to save user to DB", err });
      });
  } else {
    res.status(401).send({
      status: 401,
      message: "Only admin can access this",
    });
  }
};

exports.getProject = (req, res) => {
  const user = req.user;
  // console.log(user);
  projectModel
    .find({ organisation: user.organisation })
    .populate("project_leader project_assignee", "firstName lastName")
    .exec((err, docs) => {
      if (!err) {
        return res
          .status(200)
          .send({ status: "200", message: "Project List", docs });
      } else {
        return res.status(500).send({
          status: "500",
          message: "Failed to retrieve the Project List. Try again later",
          err,
        });
      }
    });
};

exports.getProjectById = (req, res) => {
  const user = req.user;
  const projectId = { _id: req.params.id };
  projectModel
    .findOne(projectId)
    .populate("project_leader project_assignee", "firstName lastName")
    .then(async (docs) => {
      if (docs.length == 0) {
        //get Task Details

        return res.status(400).send({
          status: "400",
          message: "No project found",
        });
      }
      // const tasks = await taskModel.find({ project_id: req.params.id });
      // console.log(tasks);
      // docs._doc.tasks = tasks || [];

      return res
        .status(200)
        .send({ status: "200", message: "Project Details", docs });
    })
    .catch((err) => {
      return res.status(500).send({
        status: "500",
        message: "Failed to retrieve the Project List. Try again later",
      });
    });
};
exports.getTaskCountByProject = (req, res) => {
  const projectId = { project_id: req.params.id };
  taskModel.find(projectId, "task_status", (err, docs) => {
    if (!err) {
      let obj = {
        active: 0,
        in_progress: 0,
        qa: 0,
        completed: 0,
        backlogs: 0,
      };
      for (var i = 0; i < docs.length; i++) {
        switch (docs[i].task_status + "") {
          case "1":
            obj.active = obj.active + 1;
            break;
          case "2":
            obj.in_progress = obj.in_progress + 1;
            break;
          case "3":
            obj.qa = obj.qa + 1;
            break;
          case "4":
            obj.completed = obj.completed + 1;
            break;
          case "5":
            obj.backlogs = obj.backlogs + 1;
            break;
        }
        // obj[docs[i].task_status] = obj[docs[i].task_status] + 1;
      }

      return res
        .status(200)
        .send({ status: "200", message: "Task Count", taskCount: obj });
    } else {
      return res.status(500).send({
        status: "500",
        message: "Failed to retrieve the task List. Try again later",
      });
    }
  });
};
exports.getTaskByStatus = (req, res) => {
  const projectId = req.query.project_id;
  const taskStatus = req.query.task_status;
  const condition = { project_id: projectId, task_status: taskStatus };

  if (!projectId || !taskStatus) {
    return res.status(400).send({
      status: "400",
      message: "Project Id and Task Status is required",
    });
  }

  taskModel.find(condition, (err, docs) => {
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

exports.editProject = (req, res) => {
  const user = req.user;
  if (user.role == "admin") {
    const condition = { _id: req.params.id };
    projectModel
      .updateMany(condition, req.body)
      .then((docs) => {
        if (!docs) {
          return res
            .status(400)
            .send({ status: "400", message: "Failed to Update" });
        }
        return res.status(200).send({
          status: "200",
          message: "Succesffully Updated Project",
          docs,
        });
      })
      .catch((err) => {
        return res.status(500).send({
          status: 500,
          message: "Unable to edit project. Try again later",
        });
      });
  } else {
    res.status(401).send({
      status: 401,
      message: "Only admin can access this",
    });
  }
};

exports.assignProject = async (req, res) => {
  const user = req.user;
  const project_assignee = req.body.project_assignee;
  const remove_assignee = req.body.remove_assignee;
  console.log(user.role);

  if (user.role != "admin" && user.role != "team_leader") {
    return res.status(401).send({
      status: 401,
      message: "Only admin and project leader can access this",
    });
  }
  const project = await projectModel.findById(req.params.id);
  if (project.organisation != user.organisation) {
    return res.status(401).send({
      status: 401,
      message: "Enter project of yours organisation",
    });
  }

  if (project_assignee && project_assignee.length > 0) {
    projectModel
      .updateMany(
        { _id: req.params.id },
        { $addToSet: { project_assignee: project_assignee } }
      )
      .then((docs) => {
        if (!docs) {
          return res
            .status(400)
            .send({ status: "400", message: "Failed to Update" });
        }
        return res.status(200).send({
          status: "200",
          message: "Succesffully Updated Project",
          docs,
        });
      })
      .catch((err) => {
        return res.status(500).send({
          status: 500,
          message: "Unable to edit project. Try again later",
        });
      });
  } else if (remove_assignee && remove_assignee.length > 0) {
    projectModel
      .updateMany(
        { _id: req.params.id },
        { $pull: { project_assignee: { $in: remove_assignee } } }
      )
      .then((docs) => {
        if (!docs) {
          return res
            .status(400)
            .send({ status: "400", message: "Failed to Update" });
        }
        return res.status(200).send({
          status: "200",
          message: "Succesffully Updated Project",
          docs,
        });
      })
      .catch((err) => {
        return res.status(500).send({
          status: 500,
          message: "Unable to edit project. Try again later",
        });
      });
  } else {
    return res.status(400).send({
      status: 400,
      message: "Please select atleast one user",
    });
  }

  // if (user.role == "team_leader") {
  //   const condition = { _id: req.params.id };

  //   //push into array
  //   projectModel
  //   projectModel
  //     .updateMany(condition, req.body)
  //     .then((docs) => {
  //       if (!docs) {
  //         return res
  //           .status(400)
  //           .send({ status: "400", message: "Failed to Update" });
  //       }
  //       return res.status(200).send({
  //         status: "200",
  //         message: "Succesffully Updated Project",
  //         docs,
  //       });
  //     })
  //     .catch((err) => {
  //       return res.status(500).send({
  //         status: 500,
  //         message: "Unable to edit project. Try again later",
  //       });
  //     });
  // } else {
  //   res.status(401).send({
  //     status: 401,
  //     message: "Only admin can access this",
  //   });
  // }
};
exports.assignTeamLeader = async (req, res) => {
  const user = req.user;
  const project_leader = req.body.project_leader;
  const remove_leader = req.body.remove_leader;
  // console.log(user.role);

  if (user.role != "admin") {
    return res.status(401).send({
      status: 401,
      message: "Only admin  can access this",
    });
  }
  const project = await projectModel.findById(req.params.id);
  if (project.organisation != user.organisation) {
    return res.status(401).send({
      status: 401,
      message: "Enter project of yours organisation",
    });
  }

  if (project_leader && project_leader.length > 0) {
    projectModel
      .updateMany(
        { _id: req.params.id },
        { $addToSet: { project_leader: project_leader } }
      )
      .then((docs) => {
        if (!docs) {
          return res
            .status(400)
            .send({ status: "400", message: "Failed to Update" });
        }
        return res.status(200).send({
          status: "200",
          message: "Succesffully Updated Project",
          docs,
        });
      })
      .catch((err) => {
        return res.status(500).send({
          status: 500,
          message: "Unable to edit project. Try again later",
        });
      });
  } else if (remove_leader && remove_leader.length > 0) {
    projectModel
      .updateMany(
        { _id: req.params.id },
        { $pull: { project_leader: { $in: remove_leader } } }
      )
      .then((docs) => {
        if (!docs) {
          return res
            .status(400)
            .send({ status: "400", message: "Failed to Update" });
        }
        return res.status(200).send({
          status: "200",
          message: "Succesffully Updated Project",
          docs,
        });
      })
      .catch((err) => {
        return res.status(500).send({
          status: 500,
          message: "Unable to edit project. Try again later",
        });
      });
  } else {
    return res.status(400).send({
      status: 400,
      message: "Please select atleast one user",
    });
  }
};
