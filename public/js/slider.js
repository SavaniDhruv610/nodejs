$(document).ready(function () {
    // Function to fetch CSRF token
    function getCsrfToken() {
        return csrfToken; // Access the globally defined CSRF token
    }

    // Initialize Slick Slider
    $(".responsive").slick({
        dots: true,
        prevArrow: $(".prev-btn"),
        nextArrow: $(".next-btn"),
        infinite: true, // Set to true for infinite looping
        speed: 300,
        slidesToShow: 5,
        slidesToScroll: 5,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                },
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                },
            },
        ],
    });

    // Automatic Slide Shift every 3 seconds
    setInterval(function () {
        $('.responsive').slick('slickNext'); // Trigger Slick's 'slickNext' method
    }, 5000);
});
