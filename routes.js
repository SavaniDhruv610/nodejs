const fs = require("fs");
const requestHendeler = (req, res) => {
  const url = req.url;
  const method = req.method;

  if (url === "/") {
    res.setHeader("Content-Type", "text/html");
    res.write("<html>");
    res.write("<head><title>first node code</title></head>");
    res.write(
      '<body><form action="/message" method="POST" name="submit"><input type="text" name="message"><button type="submit">Submit</button></form></body>'
    );
    res.write("</html>");
    return res.end();
  }

  if (url === "/message" && method === "POST") {
    const body = [];
    req.on("data", (chunk) => {
      console.log(chunk);
      body.push(chunk);
    });
    return req.on("end", () => {
      const parsedBody = Buffer.concat(body).toString();
      const message = parsedBody.split("=")[1];
      console.log(parsedBody);
      fs.writeFile("message.txt", message, (err) => {
        res.statusCode = 302;
        res.setHeader("Location", "/");
        return res.end();
      });
    });
  }

  res.setHeader("Content-Type", "text/html");
  res.write("<html>");
  res.write("<head><title>first node code</title></head>");
  res.write("<body><h1>Hello</h1></body>");
  res.write("</html>");
  res.end();
};

// module.exports = requestHendeler;

// module.exports = {
//     heandler : requestHendeler,
//     text : "hard coded file in massage"
// };

module.exports.heandler = requestHendeler;
// module.exports.text = "hello";
