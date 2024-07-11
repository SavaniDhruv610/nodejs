$(document).ready(function () {
    // Function to fetch CSRF token
    function getCsrfToken() {
        return csrfToken; // Access the globally defined CSRF token
    }

    // Like and Unlike Button Click Handlers
    $('button[id^="like-"]').on('click', function () {
        const productId = $(this).attr('id').split('-')[1];
        const csrfToken = getCsrfToken(); // Fetch CSRF token
        const likeButton = $(this);
        const likeCountElement = $(`#like-count-${productId}`);
        const isLiked = likeButton.data('liked');

        $.ajax({
            url: `/products/${isLiked ? 'unlike' : 'like'}/${productId}`,
            method: 'PUT',
            headers: {
                'csrf-token': csrfToken
            },
            success: function (response) {
                console.log('Product like status updated successfully:', response);
                likeButton.toggleClass('liked', !isLiked);
                likeButton.data('liked', !isLiked);
                likeCountElement.text(response.likesCount);
            },
            error: function (error) {
                console.error('Error updating product like status:', error);
                alert('Error updating product like status. Please try again later.');
            }
        });
    });
});
    

