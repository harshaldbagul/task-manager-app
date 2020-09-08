const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/task");
const auth = require("../middleware/auth");


const router = new express.Router();

router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed == 'true' ? true : false;
  }

  if (req.query.sortBy) {
    const [prop, order] = req.query.sortBy.split(':');
    sort[prop] = order == 'desc' ? -1 : 1;
  }
  try {
    //  const tasks = await Task.find({owner:req.user._id});
    await req.user.populate({
      path: 'tasks', match, options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    try {
      const task = await Task.findOne({
        _id: req.params.id, owner: req.user._id
      });
      if (task) {
        res.send(task);
      } else {
        res.status(404).send();
      }
    } catch (e) {
      res.status(500).send();
    }
  } else {
    res.status(400).send({ error: "Invalid id" });
  }
});

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body, owner: req.user._id
  })
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidUpdate = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (isValidUpdate && mongoose.Types.ObjectId.isValid(req.params.id)) {
    try {
      const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
      if (task) {
        updates.forEach((update) => (task[update] = req.body[update]));
        await task.save();
        res.send(task);
      } else {
        res.status(404).send();
      }
    } catch (e) {
      res.status(500).send(e);
    }
  } else {
    res.status(400).send({ error: "Invalid updates" });
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    try {
      const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
      if (task) {
        res.send(task);
      } else {
        res.status(404).send();
      }
    } catch (e) {
      res.status(500).send(e);
    }
  } else {
    res.status(400).send({ error: "Invalid id" });
  }
});

module.exports = router;
