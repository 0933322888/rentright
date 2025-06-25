import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { getImageUrl } from '../utils/imageUtils';
import './ImageCarousel.css'; // Add this for custom styles

export default function ImageCarousel({ images }) {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: false,
  };

  return (
    <div className="carousel-container">
      <Slider {...settings} className="carousel-slider">
        {images && images.length > 0 ? (
          images.map((img, idx) => (
            <div key={idx} className="carousel-slide">
              <img
                src={getImageUrl(img)}
                alt={`Property image ${idx + 1}`}
                className="carousel-image"
              />
            </div>
          ))
        ) : (
          <div className="carousel-slide carousel-no-image">
            No images available
          </div>
        )}
      </Slider>
    </div>
  );
}