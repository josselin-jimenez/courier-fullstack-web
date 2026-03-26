import { useEffect, useState } from "react";
import axios from "axios";
// axios = library for making HTTP requests to backend

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // process.env.REACT_APP_API_URL comes from your .env file
    axios.get(`${process.env.REACT_APP_API_URL}/api/test`)
      .then(res => {
        setMessage(res.data.message);
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  return (
    <div>
      <h1>Frontend</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;