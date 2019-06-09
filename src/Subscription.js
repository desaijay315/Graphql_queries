import { GraphQLServer, PubSub } from 'graphql-yoga';
import uuidv4 from 'uuid/v4';
//realtionships

//array of users
const pubsub = new PubSub();

const users = [{
    id:"1234",
    name:"jay desai",
    email: "jay@jay.com",
    age:27
},{
    id:"5678",
    name:"jhon",
    email: "jhon@jhon.com",
    age:27
},
{
    id:"8910",
    name:"ram",
    email: "ram@ram.com",
    age:27
}];

//array of posts
const posts = [{
    id:'123',
    title:'my new blog',
    body:'new blog body',
    published:true,
    author: '8910'
},{
    id:'456',
    title:'blog 2',
    body:'blog body 2',
    published:false,
    author: '1234'
    },
    {
    id:'789',
    title:'blog 3',
    body:'blog body 3',
    published:true,
    author: '5678'
}];

//Custom Types

const typeDefs = `
    type Query {
        greeting(name: String): String!
        users(query: String):[User!]!
        me: User!
        post(query: String):[Post!]!
    }

    type User{
        id: ID!
        name: String!
        email: String!
        age: Int
        posts:[Post!]!
    }

    type Post{
        id:ID!
        title:String!
        body:String!
        published:Boolean!
        author: User!
    }

    type Mutation{
        createNewUser(name: String!, email: String!, age: Int): User!
        createPost(title: String!, body: String!, published: Boolean!, author: ID!): Post!
        deleteUser(id: ID!): User!
        updateUser(id: ID!, name: String, email: String, age: Int): User!
        updatePost(id: ID!, body: String, published: Boolean): Post!
        deletePost(id: ID!): Post!
        createPost(title: String!, body: String!, published: Boolean!, author: ID!): Post!
    }

    type Subscription {
        post: PostSubscriptionPayload!
    }

    type PostSubscriptionPayload {
        mutation: String!
        data: Post!
    }
`


const resolvers = {
    Query:{
        users(parent,args,ctx,info){
            if(!args.query){
                return users
            }
            return users.filter((user)=>{
                return user.name.toLowerCase().includes(args.query.toLowerCase())
            })
        },
        greeting(parent,args,ctx,info){
            if(args.name){
                return `Hello ${args.name}`
            }else{
                return `hello`
            }
        },
        me(){
            return{
                id:'1233',
                name: 'mike',
                email: 'a@a.com',
                age: 10
            }
        },
        post(parent,args,ctx,info){
            if(!args.query){
                return posts;
            }
            return posts.filter((post) => {
                const body =  post.body.toLowerCase().includes(args.query.toLowerCase())
                const title =  post.title.toLowerCase().includes(args.query.toLowerCase())
                return body || title;
            })
        }
    },
    Post:{
        author(parent,args,ctx,info){
            return users.find((user) =>{
                return user.id === parent.author
            })
        }
    },
    User:{
        posts(parent,args,ctx,info){
            return posts.filter((post) =>{
                return post.author === parent.id
            })
        }
    },
    Subscriptions:{
        post:{
            subscribe(parent, args, ctx, info){
                return ctx.pubsub.asyncIterator('post')
            }
        }
    },
    Mutation:{
        createNewUser(parent,args,ctx,info){
            const isEmailExists = users.some((user) => user.email === args.email)
            if(isEmailExists){
              throw new Error('Email already Taken')
            }
 
            const user = {
                id:uuidv4(),
                name:args.name,
                email:args.email,
                age:args.age
            }
            users.push(user)
 
            return user
         },
        updateUser(parent, args, ctx, info){
            const user = users.find((user) => user.id === args.id)
            if(!user){
                throw new Error('User does not exist!')
            }
    
            if(typeof args.email === 'string'){
                const isEmailExists = db.users.some((user) => user.email === args.email)
                if(isEmailExists){
                    throw new Error('Email already Taken')
                }
                user.email = args.email
            }
    
            if(typeof args.name === 'string'){
                user.name = args.name
            }
    
            if(typeof args.age !== 'undefined'){
                user.age = args.age
            }
    
            return user    
    },
    deleteUser(parent,args,ctx,info){
        const isUserExists = users.findIndex((user)=> user.id === args.author)

        if(!isUserExists){
            throw new Error('User does not exist!')
        }
        //splice will return the removed items from the array object
        const userdeleted = users.splice(isUserExists, 1)
       return userdeleted[0]
    },
    deletePost(parent,args,{db,pubsub},info){
        const isPostExists = db.posts.findIndex((post)=> post.id === args.id)
         if(isPostExists === -1){
             throw new Error('Post does not exist!')
         }
         //splice will return the index of the removed items from the array object
         const [post] = db.posts.splice(isPostExists, 1)
 
         db.comments = db.comments.filter((comment) => comment.post !== args.id)
 
         if(post.published){
             pubsub.publish('post', {
                 post:{
                     mutation: 'DELETED',
                     data: post
                 }
             })
         }
         console.log(post)
 
         return post
     },
    createPost(parent,args,ctx,info){
        const userExists = users.some((user)=> user.id === args.author)

        if(!userExists){
            throw new Error('User does not exist!')
        }
        
        //use this
        const post = {
            id: uuidv4(),
            title: args.title,
            body: args.body,
            published: args.published,
            author:args.author
        }
        

        posts.push(post)

        if(args.published === true){
            pubsub.publish('post', {
                post:{
                    mutation: 'CREATED',
                    data: post
                }
            })  
        }

        return post

},
updatePost(parent,args,{db, pubsub}, info){
    const { id } = args
    const post = db.posts.find((post) => post.id === id)
    const originalPost = {...post}
    if (!post) {
        throw new Error('Post not found')
    }

    if (typeof args.body === 'string') {
        post.body = args.body
    }

    if (typeof args.published === 'boolean') {
        post.published = args.published

        if(originalPost.published && !post.published){
            pubsub.publish('post', {
                post:{
                    mutation: 'DELETED',
                    data: originalPost
                }
            })
        }else if(!originalPost.published && post.published){
            pubsub.publish('post', {
                post:{
                    mutation: 'CREATED',
                    data: post
                }
            })
        }
    }else if(post.published){
        pubsub.publish('post', {
            post:{
                mutation: 'UPDATED',
                data: post
            }
        })
    }
    return post
},
}
}

const server  = new GraphQLServer({
    typeDefs,
    resolvers,
    context:{
        pubsub
    }
})

// since the property name matches up with a variable with the same name, i am using object property shorthand

const options = {
    port: 8005   
  }

server.start(options, ({ port }) =>
  console.log(
    `Server started, listening on port ${port} for incoming requests.`,
  ),
)