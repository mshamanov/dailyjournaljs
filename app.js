/* BEGIN OF INIT VARIABLES */
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const POSTS_PER_PAGE = 5;
const MAX_SHORT_POST_LENGTH = 100;

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutStartingContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactStartingContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
/* END OF INIT VARIABLES */

/* BEGIN OF DATABASE CONFIG */
mongoose.connect('mongodb://127.0.0.1:27017/journalDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("MongoDB connected");
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  date: {
    type: Date,
    default: Date.now
  },
});

const Post = mongoose.model('Post', postSchema);
/* END OF DATABASE CONFIG */

// posts.push(createPost("Hello World", "My New Journal"));

/* BEGIN OF GET REQUEST HANDLERS */
app.get("/:pageNum(\\d+)?", (req, res) => {
  const pageNum = req.params.pageNum || 1;

  const options = {
    sort: {
      date: -1
    },
    skip: (pageNum - 1) * POSTS_PER_PAGE,
    limit: POSTS_PER_PAGE
  };

  const callback = function(err, posts) {
    let result;

    if (err) {
      console.log(err);
      result = [];
    } else {
      result = posts.map(el => {
        if (el.content.length > MAX_SHORT_POST_LENGTH) {
          el.content = el.content.substring(0, MAX_SHORT_POST_LENGTH) + "...";
        }
        console.log(el);
        return el;
      });
    }

    Post.estimatedDocumentCount(function(err, count) {
      res.render("home", {
        content: {
          main: {
            title: "Home",
            text: homeStartingContent
          },
          posts: result,
          info: {
            currentPage: pageNum,
            totalPages: Math.ceil(count / POSTS_PER_PAGE)
          },
        }
      });
    });
  };

  findAllPosts({}, options, callback);
});

app.get("/about", (req, res) => {
  res.render("about", {
    content: {
      main: {
        title: "About Us",
        text: aboutStartingContent
      }
    }
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    content: {
      main: {
        title: "Contact Us",
        text: contactStartingContent
      }
    }
  });
});

app.get("/compose", (req, res) => {
  res.render("compose");
});

app.get("/posts/:id", (req, res) => {
  const id = req.params.id;

  Post.findOne({
    _id: id
  }, function(err, found) {
    if (err) {
      console.log(err);
    }
    res.render("post", {
      post: found || {
        title: "Error",
        content: "Not found"
      }
    });
  });
});
/* END OF GET REQUEST HANDLERS */

/* BEGIN OF POST REQUEST HANDLERS */
app.post("/compose", (req, res) => {
  const title = req.body.title;
  const content = req.body.content;

  createPost(title, content, (post) => res.redirect("/"));
});
/* END OF POST REQUEST HANDLERS */

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

/* BEGIN OF FUNCTIONS */
function createPost(title, content, callback) {
  const post = new Post({
    title: title,
    content: content,
  })
  post.save().then(post => callback(post));
}

function findAllPosts(query, options, callback) {
  Post
    .find(query)
    .select(options.select)
    .skip(options.skip)
    .limit(options.limit)
    .sort(options.sort)
    .lean(options.lean)
    .exec(function(err, docs) {
      if (err) return callback(err, null);

      return callback(null, docs);
    });
}
/* END OF FUNCTIONS */
