import React from 'react';

interface GameBoardProps {
  onCategorySelect?: (categoryIndex: number, points: number) => void;
  currentCategory?: number;
  showCategoryNavigation?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  onCategorySelect,
  currentCategory = 0,
  showCategoryNavigation = false
}) => {
  const categories = [
    {
      name: 'الإمارات',
      image: 'https://images.pexels.com/photos/162031/dubai-tower-arab-khalifa-162031.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      frameColor: 'border-blue-500',
      buttonColor: 'bg-blue-500'
    },
    {
      name: 'قطر', 
      image: 'https://images.pexels.com/photos/1329510/pexels-photo-1329510.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      frameColor: 'border-green-500',
      buttonColor: 'bg-green-500'
    },
    {
      name: 'السعودية',
      image: 'https://images.pexels.com/photos/4350057/pexels-photo-4350057.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      frameColor: 'border-red-500',
      buttonColor: 'bg-red-500'
    },
    {
      name: 'لغة وأدب',
      image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      frameColor: 'border-purple-500',
      buttonColor: 'bg-purple-500'
    },
    {
      name: 'عالم الشعر',
      image: 'https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      frameColor: 'border-purple-500',
      buttonColor: 'bg-purple-500'
    },
    {
      
      name: 'متنوعات',
      image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      frameColor: 'border-orange-500',
      buttonColor: 'bg-orange-500'
    }
  ];

  const pointValues = [200, 400, 600];

  const handlePointClick = (categoryIndex: number, points: number) => {
    if (onCategorySelect) {
      onCategorySelect(categoryIndex, points);
    }
  };

  
  const displayCategories = showCategoryNavigation 
    ? [categories[currentCategory]] 
    : categories;

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="container mx-auto">
        {}
        <div className={`grid ${showCategoryNavigation ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-4 md:gap-8 lg:gap-12`}>
          {displayCategories.map((category, categoryIndex) => {
            const actualCategoryIndex = showCategoryNavigation ? currentCategory : categoryIndex;
            
            return (
              <div key={categoryIndex} className="relative flex items-center justify-center">
                {}
                <div className={`relative rounded-xl overflow-hidden shadow-xl border-4 ${category.frameColor}`} 
                  style={{ 
                    width: '100%', 
                    maxWidth: '400px',
                    aspectRatio: '2/3'
                  }}>
                  {}
                  <img 
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400&h=600';
                    }}
                  />
                  
                  {}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-3 text-center">
                    <span className="text-white text-lg sm:text-xl font-bold">{category.name}</span>
                  </div>
                  
                  {}
                  <div className="absolute top-2 right-2 bg-black/80 px-3 py-1 text-white text-xs sm:text-sm rounded-lg">
                    <span>متبقي 6</span>
                  </div>
                </div>

                {}
                <div className="absolute left-0 top-0 bottom-0 -ml-4 sm:-ml-8 md:-ml-12 lg:-ml-16 flex flex-col justify-center gap-2 sm:gap-3 md:gap-4">
                  {pointValues.map((points) => (
                    <button
                      key={`left-${points}`}
                      onClick={() => handlePointClick(actualCategoryIndex, points)}
                      className={`
                        ${category.buttonColor} 
                        text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl
                        rounded-lg
                        hover:scale-105 transition-all duration-200
                        shadow-lg
                        w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16
                        flex items-center justify-center
                      `}
                    >
                      {points}
                    </button>
                  ))}
                </div>

                {}
                <div className="absolute right-0 top-0 bottom-0 -mr-4 sm:-mr-8 md:-mr-12 lg:-mr-16 flex flex-col justify-center gap-2 sm:gap-3 md:gap-4">
                  {pointValues.map((points) => (
                    <button
                      key={`right-${points}`}
                      onClick={() => handlePointClick(actualCategoryIndex, points)}
                      className={`
                        ${category.buttonColor} 
                        text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl
                        rounded-lg
                        hover:scale-105 transition-all duration-200
                        shadow-lg
                        w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16
                        flex items-center justify-center
                      `}
                    >
                      {points}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};