// Load environment variables from the .env.test file
const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });

const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../../index.js").getExpressApp(); 

const expect = chai.expect;


chai.use(chaiHttp);

describe("User API", () => {
    // Need a valid token to test protected endpoints
    let token;
  
    describe("POST /auth/register", () => {
      it("should register a new user", (done) => {
        chai.request(app)
          .post('/auth/register')
          .send({
            "username": "testnewusertest",
            "mobile": "1234567890",
            "email": "testnewusertest@example.com",
            "password": "password123",
            "confirm_password": "password123"
          })
          .end((err, res) => {
            if (err) {
                console.log("Register error:", err);
              }
            expect(err).to.be.null;
            expect(res.status).to.be.equal(200);
            expect(res.body).to.be.a('object');
            done();
          });
      });
    });
  
    describe("POST /auth/login", () => {
      it("should login the user and return a token", (done) => {
        chai.request(app)
          .post('/auth/login')
          .send({
            "username": "testnewusertest",
            "password": "password123"
          })
          .end((err, res) => {
            if (err) {
                console.log("Login error:", err);
              }
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            expect(res.body).to.have.property("token").that.is.a("string");
            token = res.body.token;
            console.log("Token:", token);
            done();
          });
      });
    });
  
    describe("GET /user/profile", () => {
      // Make sure the token is set before running this test
      before((done) => {
        if (!token) {
          return done(new Error("Token is not set"));
        }
        done();
      });
  
      it("should return user profile information", (done) => {
        chai.request(app)
          .get("/user/profile")
          .set('Cookie', `jwt=${token}`) // Token as a cookie
          .end((err, res) => {
            if (err) {
                console.log("User profile error:", err);
              }
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            expect(res.body).to.have.property("status").that.equals(200);
            expect(res.body).to.have.property("success").that.equals(true);
            expect(res.body).to.have.property("user").that.is.an("object");
            done();
          });
      });
  
      it("should return unauthorized when token is not provided", (done) => {
        chai
          .request(app)
          .get("/user/profile")
          .end((err, res) => {
            if (err) {
                console.log("Unauthorized error:", err);
              }
            expect(err).to.be.null;
            expect(res).to.have.status(401);
            expect(res.body).to.be.an("object");
            expect(res.body).to.have.property("status").that.equals(401);
            expect(res.body).to.have.property("success").that.equals(false);
            expect(res.body).to.have.property("message");
            done();
          });
      });
    });
  });
  
