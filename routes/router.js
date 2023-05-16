const express = require("express");
const router = express.Router();

const {
  signupValidation,
  loginValidation,
} = require("../middleware/validation");
const { requiredAuth } = require("../middleware/requiredAuth");
const {
  signup,
  signin,
  signout,
  getUser,
  getLoginUser,
  userEdit,
  userApproveOrReject,
  forgetPassword,
  getTeamLeaderList,
  changeUserRoles,
  signinwithorgs,
  signupwithorgs,
  getEmployeeList,
  allUsers,
  getObserversList,
} = require("../controllers/userController");
const {
  createTask,
  getTask,
  editTask,
  closeTask,
  reminderTask,
  getTaskByProject,
  getTaskById,
  changeTaskStatus,
} = require("../controllers/taskController");
const {
  createProject,
  getProject,
  editProject,
  getProjectById,
  getTaskCountByProject,
  getTaskByStatus,

  assignProject,
  assignTeamLeader,
} = require("../controllers/projectController");
const { createRole, getRole } = require("../controllers/roleController");
const {
  createComment,
  getComment,
} = require("../controllers/commentController");
const { getNotification } = require("../controllers/notificationController");
const { resetPassword } = require("../services/passwordReset");
const { createPayroll } = require("../controllers/payrollController");
const {
  createOrganisation,
  checkSubDomain,
  sendInviteFromOrganisation,
  getOrganisationList,
} = require("../controllers/organisationController");
const {
  allMessages,
  sendMessage,
} = require("../controllers/messageController");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
} = require("../controllers/chatContoller");

//Organisation

router.post("/createOrganisation", createOrganisation);
router.post("/checkSubDomain", checkSubDomain);
router.get("/getOrganisationList", getOrganisationList);
router.post("/sendInvite", requiredAuth, sendInviteFromOrganisation);

//user create
router.post("/signup", signupValidation, signup);
router.post("/signupwithorgs", signupValidation, signupwithorgs);
router.post("/signin", loginValidation, signin);
router.post("/signinwithorgs", loginValidation, signinwithorgs);
router.get("/loggedInUser", requiredAuth, getLoginUser);
router.get("/signout", requiredAuth, signout);

router.get("/userList", requiredAuth, getUser);
router.get("/teamLeader", requiredAuth, getTeamLeaderList);
router.get("/observerlist", requiredAuth, getObserversList);
router.get("/employeeList", requiredAuth, getEmployeeList);
router.put("/editUser/:id", requiredAuth, userEdit);
router.post("/changeUserRoles/:id", requiredAuth, changeUserRoles);
router.post("/userApproveOrReject/:id", requiredAuth, userApproveOrReject);

//task create
router.post("/Task", requiredAuth, createTask);
router.get("/taskList", requiredAuth, getTask);
router.get("/taskListByProject/:id", requiredAuth, getTaskByProject);
router.get("/task/:id", requiredAuth, getTaskById);
router.put("/taskEdit/:id", requiredAuth, editTask);
router.put("/taskClose/:id", requiredAuth, closeTask);
router.get("/taskReminder/:id", requiredAuth, reminderTask);
router.post("/changeTaskStatus/:id", requiredAuth, changeTaskStatus);

//create project
router.post("/project", requiredAuth, createProject);
router.get("/projectList", requiredAuth, getProject);
router.put("/projectEdit/:id", requiredAuth, editProject);
router.get("/projectDetails/:id", requiredAuth, getProjectById);
router.get("/projectTaskCount/:id", requiredAuth, getTaskCountByProject);
router.get("/projecttaskListByStatus", requiredAuth, getTaskByStatus);
router.put("/assignProject/:id", requiredAuth, assignProject);
router.put("/assignTeamLeader/:id", requiredAuth, assignTeamLeader);

//create role
router.post("/role", requiredAuth, createRole);
router.get("/roleList", requiredAuth, getRole);

// comment
router.post("/comment", requiredAuth, createComment);
router.get("/comment/:task_id", requiredAuth, getComment);

// Notification route
router.get("/notification/:user_id", requiredAuth, getNotification);

// forget password route
router.post("/forgetPassword", forgetPassword);

// api for reset password
router.post("/resetPassword/:id", resetPassword);

// payroll routes
router.post("/payroll", requiredAuth, createPayroll);

//Chat routes
router.get("/user", requiredAuth, allUsers);
router.get("/message/:chatId", requiredAuth, allMessages);
router.post("/message/", requiredAuth, sendMessage);
router.post("/chat/", requiredAuth, accessChat);
router.get("/chat/", requiredAuth, fetchChats);
router.post("/group", requiredAuth, createGroupChat);
router.put("/rename", requiredAuth, renameGroup);
router.put("/groupremove", requiredAuth, removeFromGroup);
router.put("/groupadd", requiredAuth, addToGroup);

module.exports = router;
