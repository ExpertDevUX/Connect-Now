console.log("Connect-Now Helper Active");

// Listen for messages from the web app
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CONNECT_NOW_EXT_REQUEST") {
    console.log("Connect-Now extension received request:", event.data);
    // Future integration logic here
  }
});