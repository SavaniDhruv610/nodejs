const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector("[name=productId]").value;
    const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
    const productElement = btn.closest("article"); // Corrected typo here
  
    fetch("/admin/product/" + productId, {
      method: "DELETE",
      headers: {
        "csrf-token": csrf,
      },
    })
      .then((result) => {
        console.log(result);
        return result.json();
      })
      .then((data) => {
        console.log(data);
        if (productElement) {
          productElement.remove();
        } else {
          console.log("Product element not found");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };


  