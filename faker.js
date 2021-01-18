const faker = require("faker");
const User = require("./models/User");
const mongoose = require("mongoose");

var express = require("express");
app = express();

function randVal() {
  var x = Math.floor(Math.random() * arguments.length);
  return arguments[x];
}

const data = {
  fake: () => {
    for (let i = 0; i < 100; i++) {
      const newUser = new User({
        _id: mongoose.Types.ObjectId(),
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(60),
        dob: faker.date.past(),
        creationDate: faker.date.recent(),
        verified: true,
        extendedProf: true,
        bio: faker.lorem.sentence(),
        agePref: randVal(
          "age1",
          "age2",
          "age3",
          "age4",
          "age5",
          "age6",
          "age7"
        ),
        gender: randVal("male", "female"),
        fame: faker.random.number(5),
        likes: faker.random.number(500),
        views: faker.random.number(1000),
        age: faker.random.number({ min: 18, max: 66 }),
        sexPref: randVal("male", "female", "both"),

        interests: {
          first: randVal("cooking", "coding", "friends"),
          second: randVal("gaming", "love"),
          third: randVal("geek", "exercise", "photography"),
          fourth: randVal("traveling", "pets"),
          fifth: randVal("sports", "family")
        },

        profileImages: {
          image1: faker.image.avatar(),
          image2: faker.image.avatar(),
          image3: faker.image.avatar(),
          image4: faker.image.avatar(),
          image5: faker.image.avatar()
        },

        country: faker.address.country(),
        province: faker.address.state(),
        city: faker.address.city(),
        lat: faker.address.latitude(),
        long: faker.address.longitude(),
        gender2: "both"
      });
      newUser.save();
    }
  }
};

module.exports = data;