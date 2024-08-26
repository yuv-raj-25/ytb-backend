require('dotenv').config()
const express = require('express')

const app = express();

const port = 3000;

const githubdata = {
    "login": "yuv-raj-25",
    "id": 114861742,
    "node_id": "U_kgDOBtimrg",
    "avatar_url": "https://avatars.githubusercontent.com/u/114861742?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/yuv-raj-25",
    "html_url": "https://github.com/yuv-raj-25",
    "followers_url": "https://api.github.com/users/yuv-raj-25/followers",
    "following_url": "https://api.github.com/users/yuv-raj-25/following{/other_user}",
    "gists_url": "https://api.github.com/users/yuv-raj-25/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/yuv-raj-25/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/yuv-raj-25/subscriptions",
    "organizations_url": "https://api.github.com/users/yuv-raj-25/orgs",
    "repos_url": "https://api.github.com/users/yuv-raj-25/repos",
    "events_url": "https://api.github.com/users/yuv-raj-25/events{/privacy}",
    "received_events_url": "https://api.github.com/users/yuv-raj-25/received_events",
    "type": "User",
    "site_admin": false,
    "name": "Yuvraj Chaudhary",
    "company": null,
    "blog": "",
    "location": null,
    "email": null,
    "hireable": null,
    "bio": null,
    "twitter_username": null,
    "public_repos": 13,
    "public_gists": 0,
    "followers": 1,
    "following": 6,
    "created_at": "2022-10-02T12:02:51Z",
    "updated_at": "2024-08-23T13:16:44Z"
    }

app.get('/', (req,res) =>{
    res.send('hello world')
})

app.get('/twitter' , (req,res)=>{
    res.send('yuvraj chaudhary')

})
app.get('/github' , (req  , res) => {
    res.json(githubdata)
})

app.get('/login', (req , res) => {
    res.send('<h1>please login at the app </h1>')
})

app.listen(process.env.PORT, ()=>{
    console.log(`App listen on the port ${port}`);
})