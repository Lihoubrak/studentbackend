const ContributionHealthcare = require("./ContributionHealthcare");
const Conversation = require("./Conversation");
const Dormitory = require("./Dormitory");
const Electrical = require("./Electrical");
const Event = require("./Event");
const ExpoNotifications = require("./ExpoNotifications");
const Healthcare = require("./Healthcare");
const Major = require("./Major");
const Message = require("./Message");
const Notification = require("./Notification");
const ParticipantEvent = require("./ParticipantEvent");
const Passport = require("./Passport");
const ProductEvent = require("./ProductEvent");
const Role = require("./Role");
const Room = require("./Room");
const School = require("./School");
const SupportEvent = require("./SupportEvent");
const User = require("./User");
const Water = require("./Water");

const Relationship = () => {
  // Define associations

  // User associations
  User.hasOne(Passport); // User has many passports
  Passport.belongsTo(User); // Passport belongs to a user
  Major.hasMany(User); // Major has many users
  User.belongsTo(Major); // User belongs to a major
  Room.hasMany(User); // Room has many users
  User.belongsTo(Room); // User belongs to a room
  Role.hasMany(User); // Role has many users
  User.belongsTo(Role); // User belongs to a role
  School.hasMany(Major); // School has many majors
  Major.belongsTo(School); // Major belongs to a school
  Dormitory.hasMany(Room); // Dormitory has many rooms
  Room.belongsTo(Dormitory); // Room belongs to a dormitory
  Room.hasMany(Electrical); // Room has many electrical data
  Electrical.belongsTo(Room); // Electrical data belongs to a room
  Room.hasMany(Water); // Room has many water data
  Water.belongsTo(Room); // Water data belongs to a room
  User.hasMany(Event); // User has many events
  Event.belongsTo(User); // Event belongs to a user
  Event.hasMany(SupportEvent); // Event has many support events
  SupportEvent.belongsTo(Event); // Support event belongs to an event
  Event.hasMany(ProductEvent); // Event has many product events
  ProductEvent.belongsTo(Event); // Product event belongs to an event
  Event.hasMany(ParticipantEvent); // Event has many participant events
  ParticipantEvent.belongsTo(Event); // Participant event belongs to an event
  User.hasMany(ParticipantEvent); // User has many participant events
  ParticipantEvent.belongsTo(User); // Participant event belongs to a user
  User.hasMany(Healthcare); // User has many healthcare data
  Healthcare.belongsTo(User); // Healthcare data belongs to a user
  User.hasMany(ContributionHealthcare); // User has many contribution healthcare data
  ContributionHealthcare.belongsTo(User); // Contribution healthcare data belongs to a user
  User.hasMany(Dormitory); // User has many dormitories
  Dormitory.belongsTo(User); // Dormitory belongs to a user
  User.hasMany(School); // User has many schools
  School.belongsTo(User); // School belongs to a user

  Notification.hasMany(ExpoNotifications);
  ExpoNotifications.belongsTo(Notification);
  User.hasMany(Notification);
  Notification.belongsTo(User);

  Message.belongsTo(User, { as: "sender", foreignKey: "sender_id" });
  Message.belongsTo(User, { as: "receiver", foreignKey: "receiver_id" });
  Message.belongsTo(Conversation, { foreignKey: "conversation_id" });
};

module.exports = Relationship;
