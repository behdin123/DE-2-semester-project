/*
 * This workflow test file, is testing that the user can be registered + login, use token stored in coockie, create project and Remove it.
 * its also testing, Invalid input test, so when we try to register a user with only 1 letter as username and 3 charachters for 
 * password, it should not allow it.
 */

// Load environment variables from the .env.test file
const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });

const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../../index.js").getExpressApp();
const path = require('path');


const fs = require('fs');
const { ProjectModel }  = require('../models/project.js');
const { UserModel }  = require('../models/user.js');


const expect = chai.expect;

chai.use(chaiHttp);

// test start
describe('Project workflow tests', () => {

    // Clean up the database before and after each test
    beforeEach((done) => { 
        ProjectModel.deleteMany({}, function(err) {});
        UserModel.deleteMany({}, function(err) {});
        done();
    });

    afterEach((done) => {
        UserModel.deleteMany({}, function(err) {});
        ProjectModel.deleteMany({}, function(err) {});
        done();
    });

    // POST Create functional test
    it('should register + login a user, create a project and delete it from DB', (done) => {
        let user = {
            username: "gucci321",
            mobile: "53525278",
            email: "testuser@example.com",
            password: "password123",
            confirm_password: "password123",
        };

        chai.request(app)
            .post('/auth/register')
            .send(user)
            .end((err, res) => {
                expect(res.status).to.be.equal(200);
                expect(res.body).to.be.a('object');
                expect(res.body.error).to.be.equal(undefined);

                console.log("Register response body:", res.body);


                // 2) Login the user
                chai.request(app)
                    .post('/auth/login')
                    .send({
                        "username": "gucci321",
                        "password": "password123"
                    })
                    .end((err, res) => {

                        if (res.status !== 200) {
                            console.log("Login error:", res.body);
                        }

                        expect(res.status).to.be.equal(200);
                        expect(res.body.error).to.be.equal(undefined);
                        let token = res.body.token;

                        console.log("Login response body:", res.body);
                        console.log("Token:", token);

                        
                        let project = {
                            title: "Test Project",
                            description: "Test Project Description",
                            tags: ["tag1", "tag2"]
                          };


                        // 3) Create a new project
                        chai.request(app)
                            .post('/project/create')
                            .set('Cookie', `jwt=${token}`)

                            .field('title', project.title)
                            .field('description', project.description)
                            .field('tags', JSON.stringify(project.tags)) // convert tag's array to string
                            .attach('image', fs.readFileSync(path.join(__dirname, 'images', 'african-lion-2888519.jpg')), 'african-lion-2888519.jpg')

                            .end((err, res) => {
                                if (res.status !== 201) {
                                console.log("Project creation error:", res.body);
                                }
                                expect(res.status).to.be.equal(201);
                                expect(res.body).to.be.a('object');

                                let savedProject = res.body.project;

                                console.log('savedProject:', savedProject); // Add this line

                                expect(savedProject.title).to.be.equal(project.title);
                                expect(savedProject.description).to.be.equal(project.description);
                               
                                console.log("Project creation error:", res.body);
                                    

                                // 4) remove a new project
                                chai.request(app)
                                    .delete('/project/remove/' + savedProject._id)
                                    .set("Cookie", `jwt=${token}`)
                                    .end((err, res) => {
                                        expect(res.status).to.be.equal(200);
                                        const actualVal = res.body.message;
                                        expect(actualVal).to.be.equal('The project and associated columns were successfully deleted');
                                        done();
                                    });
                            });
                    });
            });
    });


    // Invalid input test
    it('invalid user input test', (done) => {

        // 1) Register with invalid inputs
        let user = {
            username: "u", // wrong username - validation should catch this
            mobile: "53525278",
            email: "testuser@example.com",
            password: "123", // wrong password - should at least be between 6 and 16 characters
            confirm_password: "123",
        }

        chai.request(app)
            .post('/auth/register') 
            .send(user)
            .end((err, res) => {

                // Asserts
                expect(res.status).to.be.equal(400); 

                expect(res.body).to.be.a('object');
                expect(res.body.messages).to.be.a('object');

                console.log("res.body.errors:", res.body);
                
                const messages = res.body.messages;
                expect(messages.username).to.be.equal("this username isn't allowed");
                expect(messages.password).to.be.equal("The password should at least be between 6 and 16 characters");
                
                done();
            });
    });

});
