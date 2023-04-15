const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../../index.js").getExpressApp(); 

const expect = chai.expect;


chai.use(chaiHttp);

describe("User API", () => {
  // Need a valid token to test protected endpoints
  // Valid token
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NDM1MzQyZjQ4MmZmN2Y4YWUwZjBmZWUiLCJ1c2VybmFtZSI6Im5pY28iLCJpYXQiOjE2ODEzODI4MjUsImV4cCI6MTY4MTQ2OTIyNX0.-PqYQ9x_od52BXghK8QyBeWAe74l328aWrAHqoHXyiY";

  describe("GET /user/profile", () => {
    it("should return user profile information", (done) => {
      chai
        .request(app)
        .get("/user/profile")
        .set("Cookie", 'token=${token}') // Token as a cookie
        .end((err, res) => {
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
