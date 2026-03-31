function UmaDashboard() {
    return (<div style={{ textAlign: "center", marginTop: "80px" }}>
      <h1>Welcome to Our Courier Service</h1>
      <h2>We are currently still building it.</h2>
      <p>I want to apologize for the state of our application at this current moment.</p>
      <p> Our database and backend are hosted on Railway and our frontend on Vercel.</p>
      <p>Although it may not seem it, your login is stored in our database and logging in sent a request to our backend to allow access to this page.</p>
      <p>You can verify that log in is not hardcoded by creating an account with our register page</p>
      <p>Thank you for your time Professor Uma.</p>
    </div>
    );
}

export default UmaDashboard;