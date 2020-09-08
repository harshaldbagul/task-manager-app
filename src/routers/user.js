const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const {sendWelcomeMail,sendCancellationMail}=require("../emails/account");

const router = new express.Router();

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    sendWelcomeMail(user.email,user.name);
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    const user = req.user;
    user.tokens = user.tokens.filter(token => token.token != req.token);
    await user.save();
    res.send();
  } catch (e) {
    res.send(500)
  }
})

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    const user = req.user;
    user.tokens = [];
    await user.save();
    res.send();
  } catch (e) {
    res.send(500)
  }
})

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "age", "password", "email"];
  const isValidUpdate = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (isValidUpdate) {
    try {
      const user = req.user;
      updates.forEach((update) => (user[update] = req.body[update]));
      await user.save();
      res.send(user);
    } catch (e) {
      res.status(500).send(e);
    }
  } else {
    res.status(400).send({ error: "Invalid updates" });
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    const user = req.user;
    await user.remove();
    sendCancellationMail(user.email,user.name);
    res.send(user);

  } catch (e) {
    res.status(500).send(e);
  }
}
);

const upload = multer({
  limits: {
    fieldSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(undefined, true)
    } else {
      cb(new Error('Please upload an image'))
    }
  }
})

router.post("/users/me/avatar", auth, upload.single('avatar'), async (req, res) => {

  try {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  }
  catch (e) {
    res.status(400).send();
  }
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = null;
  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.avatar) {
      res.set('Content-Type', 'image/png');
      res.send(user.avatar);
    } else {
      throw new Error();
    }
  } catch (e) {
    res.status(400).send();
  }
})

module.exports = router;
