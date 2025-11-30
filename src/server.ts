import express, { Request, Response } from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
const app = express();
const port = 3000;
//! parser middleware
app.use(express.json());
//? app.use(express.urlencoded({ extended: true }));
//! Database
const pool = new Pool({
  connectionString: `${process.env.CONNECTION_STR}`,
});
const initDB = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        age INT,
        phone VARCHAR(14),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
  await pool.query(`
        CREATE TABLE IF NOT EXISTS todos(
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT false,
        due_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
};
initDB();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from next!");
});

//? Users CRUD
app.post("/users", async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO users(name,email) VALUES($1,$2) RETURNING *`,
      [name, email]
    );
    // console.log(result.rows[0]);
    res.status(201).json({
      succes: true,
      message: "Data inserted Successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: error.message,
    });
  }
});
//? Get All Users
app.get("/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM users`);
    res.status(200).json({
      success: true,
      message: "Users retrived successfully",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      details: error,
    });
  }
});
//? Get single Users
app.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const result =await pool.query(`SELECT * FROM users WHERE id=$1`, [
      req.params.id,
    ]);
    if(result.rows.length===0){
      res.status(400).json({
        success:false,
        message:"User not found"
      })
    }
    else{
      res.status(200).json({
        success:true,
        message:"User found successfully",
        data:result.rows[0]
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
//? Update User
app.put("/user/:id",async(req:Request,res:Response)=>{
  const {name,email}=req.body;
  try {
    const result= await pool.query(`UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`,[name,email,req.params.id]);
    if(result.rows.length===0)
    res.status(400).json({
      success:false,
      message:"User not found",
    })
    else{
      res.status(200).json({
        success:true,
        message:"User updated successfully",
        data:result.rows[0],
      })
    }
  } catch (error:any) {
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
})
//? Delete User
app.delete("/user/:id",async(req:Request,res:Response)=>{
  try {
    const result=await pool.query(`DELETE FROM users WHERE id=$1`,[req.params.id]);
    if(result.rows.length===0){
      res.status(400).json({
      success:false,
      message:"User does not exist"
    })
    }
    else{
      res.status(200).json({
      success:true,
      message:"User delete successfully",
      data:null
    })
    }
  } catch (error:any) {
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
})
//! Listener
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
