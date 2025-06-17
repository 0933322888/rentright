import { useState } from 'react';

export default function ImageCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleImageError = (e) => {
    console.log('Image failed to load:', e.target.src);
    setImageError(true);
    setErrorCount(prev => prev + 1);
    
    // Prevent infinite loops by checking if we've already tried to load the fallback
    if (errorCount < 2) {
      // Use a simple data URL instead of external placeholder to avoid infinite calls
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NzM4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    } else {
      // If we've had multiple errors, just show a simple div instead
      e.target.style.display = 'none';
      const parent = e.target.parentElement;
      if (parent) {
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'w-full h-full bg-gray-100 flex items-center justify-center';
        fallbackDiv.innerHTML = '<div class="text-center text-gray-500"><p>Image unavailable</p></div>';
        parent.appendChild(fallbackDiv);
      }
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative h-96 w-full bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full">
      <img
        src={images[currentIndex].startsWith('http') 
          ? images[currentIndex] 
          : `http://localhost:10000/uploads/${images[currentIndex]}`}
        alt={`Property image ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        onError={handleImageError}
        onLoad={() => {
          setImageError(false);
          setErrorCount(0);
        }}
      />
      
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  currentIndex === index ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
} 