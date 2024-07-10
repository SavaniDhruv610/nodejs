$(document).ready(function () {
    // Function to fetch CSRF token
    function getCsrfToken() {
        return '<%= csrfToken %>'; // Use EJS syntax to get CSRF token
    }

    // Like and Unlike Button Click Handlers
    $('button[id^="like-"]').on('click', function () {
        const productId = $(this).attr('id').split('-')[1];
        const csrfToken = getCsrfToken();
        const likeButton = $(this);
        const unlikeButton = $(`#unlike-${productId}`);

        $.ajax({
            url: `/products/like/${productId}`,
            method: 'PUT',
            headers: {
                'csrf-token': csrfToken
            },
            success: function (response) {
                console.log('Product liked successfully:', response);
                likeButton.addClass('green');
                unlikeButton.removeClass('red');
            },
            error: function (error) {
                console.error('Error liking product:', error);
                alert('Error liking product. Please try again later.');
            }
        });
    });

    $('button[id^="unlike-"]').on('click', function () {
        const productId = $(this).attr('id').split('-')[1];
        const csrfToken = getCsrfToken();
        const unlikeButton = $(this);
        const likeButton = $(`#like-${productId}`);

        $.ajax({
            url: `/products/unlike/${productId}`,
            method: 'PUT',
            headers: {
                'csrf-token': csrfToken
            },
            success: function (response) {
                console.log('Product unliked successfully:', response);
                unlikeButton.addClass('red');
                likeButton.removeClass('green');
            },
            error: function (error) {
                console.error('Error unliking product:', error);
                alert('Error unliking product. Please try again later.');
            }
        });
    });

    // Initialize the Slick slider
    $('.responsive').slick({
        dots: true,
        prevArrow: $('.prev-btn'),
        nextArrow: $('.next-btn'),
        infinite: false,
        speed: 300,
        slidesToShow: 4,
        slidesToScroll: 4,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    infinite: true,
                    dots: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });
});
