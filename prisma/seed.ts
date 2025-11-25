import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌍 Starting seed: Adding hotels and restaurants database...');

  // Delete existing hotel/restaurant database trip if it exists
  const existingTrip = await prisma.trip.findFirst({
    where: {
      OR: [
        { title: { contains: '🏨 HOTEL DATABASE:' } },
        { title: { contains: '🍽️ RESTAURANT DATABASE:' } },
        { title: { contains: 'DATABASE: Global' } }
      ]
    }
  });

  if (existingTrip) {
    await prisma.trip.delete({
      where: { id: existingTrip.id }
    });
    console.log('🗑️  Deleted existing database trip');
  }

  // Create or get a demo user
  let demoUser = await prisma.user.findUnique({
    where: { email: 'demo@tripshare.org' }
  });

  if (!demoUser) {
    const hashedPassword = await bcrypt.hash('demo123', 10);
    demoUser = await prisma.user.create({
      data: {
        email: 'demo@tripshare.org',
        name: 'Demo User',
        password: hashedPassword
      }
    });
    console.log('✅ Created demo user');
  } else {
    console.log('✅ Using existing demo user');
  }

  // Create a hotel and restaurant database trip (hidden from trips list, used for suggestions)
  const databaseTrip = await prisma.trip.create({
    data: {
      title: '🏨🍽️ DATABASE: Global Hotels & Restaurants Collection',
      description: 'Database of hotels and restaurants for city-based suggestions',
      countries: JSON.stringify(['Japan', 'France', 'United States', 'United Kingdom', 'Italy', 'Spain', 'Thailand', 'Singapore', 'United Arab Emirates', 'India']),
      cities: JSON.stringify(['Tokyo', 'Paris', 'New York', 'London', 'Rome', 'Barcelona', 'Bangkok', 'Singapore', 'Dubai', 'Mumbai']),
      isPublic: true,
      isDraft: false,
      userId: demoUser.id,
      cities_data: {
        create: [
          // Tokyo, Japan - Top 10 hotels
          {
            name: 'Tokyo',
            country: 'Japan',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'Park Hyatt Tokyo',
                  location: '3-7-1-2 Nishi-Shinjuku, Shinjuku, Tokyo 163-1055',
                  rating: 5,
                  review: 'Luxury high-rise hotel with panoramic city views. Featured in "Lost in Translation".',
                  liked: true
                },
                {
                  name: 'The Ritz-Carlton Tokyo',
                  location: '9-7-1 Akasaka, Minato, Tokyo 107-0052',
                  rating: 5,
                  review: 'Elegant hotel in Roppongi with stunning city views and exceptional service.',
                  liked: true
                },
                {
                  name: 'Aman Tokyo',
                  location: '1-5-6 Otemachi, Chiyoda, Tokyo 100-0004',
                  rating: 5,
                  review: 'Ultra-luxury hotel with minimalist design and traditional Japanese aesthetics.',
                  liked: true
                },
                {
                  name: 'Mandarin Oriental Tokyo',
                  location: '2-1-1 Nihonbashi Muromachi, Chuo, Tokyo 103-8328',
                  rating: 5,
                  review: 'Sophisticated hotel in Nihonbashi with world-class dining and spa facilities.',
                  liked: true
                },
                {
                  name: 'Palace Hotel Tokyo',
                  location: '1-1-1 Marunouchi, Chiyoda, Tokyo 100-0005',
                  rating: 5,
                  review: 'Historic hotel near the Imperial Palace with modern luxury and traditional service.',
                  liked: true
                },
                {
                  name: 'Conrad Tokyo',
                  location: '1-9-1 Higashi-Shimbashi, Minato, Tokyo 105-7337',
                  rating: 4,
                  review: 'Contemporary hotel in Shimbashi with excellent location and modern amenities.',
                  liked: true
                },
                {
                  name: 'Shangri-La Tokyo',
                  location: 'Marunouchi Trust Tower Main, 1-8-3 Marunouchi, Chiyoda, Tokyo 100-8283',
                  rating: 5,
                  review: 'Luxury hotel with stunning views of Tokyo Station and the Imperial Palace.',
                  liked: true
                },
                {
                  name: 'Four Seasons Hotel Tokyo at Marunouchi',
                  location: '1-11-1 Pacific Century Place, Marunouchi, Chiyoda, Tokyo 100-6277',
                  rating: 5,
                  review: 'Intimate luxury hotel with personalized service and prime location.',
                  liked: true
                },
                {
                  name: 'The Peninsula Tokyo',
                  location: '1-8-1 Yurakucho, Chiyoda, Tokyo 100-0006',
                  rating: 5,
                  review: 'Iconic hotel with traditional Japanese hospitality and modern luxury.',
                  liked: true
                },
                {
                  name: 'Grand Hyatt Tokyo',
                  location: '6-10-3 Roppongi, Minato, Tokyo 106-0032',
                  rating: 4,
                  review: 'Stylish hotel in Roppongi with excellent dining options and vibrant atmosphere.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'Sukiyabashi Jiro',
                  location: '4-2-15 Ginza, Chuo, Tokyo',
                  rating: 5,
                  review: 'Legendary sushi restaurant with three Michelin stars. Master Jiro\'s omakase experience.',
                  liked: true
                },
                {
                  name: 'Narisawa',
                  location: '2-6-15 Minami-Aoyama, Minato, Tokyo',
                  rating: 5,
                  review: 'Innovative Japanese cuisine with focus on sustainability. Two Michelin stars.',
                  liked: true
                },
                {
                  name: 'Ryugin',
                  location: '7-17-24 Roppongi, Minato, Tokyo',
                  rating: 5,
                  review: 'Three Michelin-starred kaiseki restaurant showcasing seasonal Japanese ingredients.',
                  liked: true
                },
                {
                  name: 'Ishikawa',
                  location: '5-37 Kagurazaka, Shinjuku, Tokyo',
                  rating: 5,
                  review: 'Three Michelin-starred kaiseki in traditional setting. Exceptional seasonal menu.',
                  liked: true
                },
                {
                  name: 'Quintessence',
                  location: '1-5-4 Shirokanedai, Minato, Tokyo',
                  rating: 5,
                  review: 'Three Michelin-starred French restaurant with innovative techniques.',
                  liked: true
                },
                {
                  name: 'Den',
                  location: '2-3-18 Jingumae, Shibuya, Tokyo',
                  rating: 5,
                  review: 'Creative Japanese kaiseki with playful presentation. Two Michelin stars.',
                  liked: true
                },
                {
                  name: 'Sushi Saito',
                  location: '1-9-15 Akasaka, Minato, Tokyo',
                  rating: 5,
                  review: 'Exclusive sushi counter with three Michelin stars. Reservations extremely difficult.',
                  liked: true
                },
                {
                  name: 'L\'Effervescence',
                  location: '2-26-4 Nishi-Azabu, Minato, Tokyo',
                  rating: 5,
                  review: 'Two Michelin-starred French-Japanese fusion. Creative and elegant dishes.',
                  liked: true
                },
                {
                  name: 'Tempura Kondo',
                  location: '9-5 Kojimachi, Chiyoda, Tokyo',
                  rating: 5,
                  review: 'Two Michelin-starred tempura restaurant. Light, crispy, and perfectly seasoned.',
                  liked: true
                },
                {
                  name: 'Tsukiji Sushi Sei',
                  location: '4-13-9 Tsukiji, Chuo, Tokyo',
                  rating: 4,
                  review: 'Traditional sushi in Tsukiji market area. Fresh fish and authentic experience.',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'Senso-ji Temple',
                  location: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032',
                  rating: 5,
                  review: 'Tokyo\'s oldest temple. Beautiful architecture and traditional atmosphere.',
                  liked: true
                },
                {
                  name: 'Shibuya Crossing',
                  location: 'Shibuya City, Tokyo',
                  rating: 4,
                  review: 'World\'s busiest pedestrian crossing. Iconic Tokyo experience.',
                  liked: true
                },
                {
                  name: 'Tokyo Skytree',
                  location: '1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045',
                  rating: 5,
                  review: 'Tallest tower in Japan. Stunning panoramic views of Tokyo.',
                  liked: true
                },
                {
                  name: 'Meiji Shrine',
                  location: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557',
                  rating: 5,
                  review: 'Peaceful Shinto shrine surrounded by forest. Beautiful torii gates.',
                  liked: true
                },
                {
                  name: 'Tsukiji Outer Market',
                  location: '4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045',
                  rating: 4,
                  review: 'Vibrant market with fresh seafood, street food, and kitchenware.',
                  liked: true
                },
                {
                  name: 'Ueno Park',
                  location: 'Uenokoen, Taito City, Tokyo 110-0007',
                  rating: 4,
                  review: 'Large park with museums, zoo, and beautiful cherry blossoms in spring.',
                  liked: true
                },
                {
                  name: 'Harajuku',
                  location: 'Jingumae, Shibuya City, Tokyo',
                  rating: 4,
                  review: 'Fashion district with unique street style, cafes, and Takeshita Street.',
                  liked: true
                },
                {
                  name: 'Imperial Palace',
                  location: '1-1 Chiyoda, Chiyoda City, Tokyo 100-0001',
                  rating: 4,
                  review: 'Former Edo Castle. Beautiful gardens and historic architecture.',
                  liked: true
                },
                {
                  name: 'TeamLab Borderless',
                  location: '1-3-15 Odaiba, Koto City, Tokyo 135-0064',
                  rating: 5,
                  review: 'Immersive digital art museum. Interactive and mesmerizing experience.',
                  liked: true
                },
                {
                  name: 'Ginza District',
                  location: 'Ginza, Chuo City, Tokyo',
                  rating: 4,
                  review: 'Upscale shopping district with luxury brands, department stores, and fine dining.',
                  liked: true
                }
              ]
            }
          },
          // Paris, France - Top 10 hotels
          {
            name: 'Paris',
            country: 'France',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'The Ritz Paris',
                  location: '15 Place Vendôme, 75001 Paris',
                  rating: 5,
                  review: 'Historic luxury hotel in the heart of Paris. Elegant rooms and world-class dining.',
                  liked: true
                },
                {
                  name: 'Four Seasons Hotel George V',
                  location: '31 Avenue George V, 75008 Paris',
                  rating: 5,
                  review: 'Art Deco masterpiece with Michelin-starred restaurants and exceptional service.',
                  liked: true
                },
                {
                  name: 'Le Meurice',
                  location: '228 Rue de Rivoli, 75001 Paris',
                  rating: 5,
                  review: 'Palace hotel overlooking the Tuileries Garden with opulent interiors.',
                  liked: true
                },
                {
                  name: 'Shangri-La Hotel Paris',
                  location: '10 Avenue d\'Iéna, 75116 Paris',
                  rating: 5,
                  review: 'Former palace with Eiffel Tower views and authentic French elegance.',
                  liked: true
                },
                {
                  name: 'Hôtel Plaza Athénée',
                  location: '25 Avenue Montaigne, 75008 Paris',
                  rating: 5,
                  review: 'Iconic hotel on Avenue Montaigne with legendary dining and fashion connections.',
                  liked: true
                },
                {
                  name: 'Mandarin Oriental Paris',
                  location: '251 Rue Saint-Honoré, 75001 Paris',
                  rating: 5,
                  review: 'Contemporary luxury in the heart of the fashion district.',
                  liked: true
                },
                {
                  name: 'Le Bristol Paris',
                  location: '112 Rue du Faubourg Saint-Honoré, 75008 Paris',
                  rating: 5,
                  review: 'Elegant palace hotel with three-Michelin-starred restaurant.',
                  liked: true
                },
                {
                  name: 'Park Hyatt Paris-Vendôme',
                  location: '5 Rue de la Paix, 75002 Paris',
                  rating: 5,
                  review: 'Modern luxury hotel near Place Vendôme with sophisticated design.',
                  liked: true
                },
                {
                  name: 'Hôtel de Crillon',
                  location: '10 Place de la Concorde, 75008 Paris',
                  rating: 5,
                  review: 'Historic palace hotel with stunning views of Place de la Concorde.',
                  liked: true
                },
                {
                  name: 'The Peninsula Paris',
                  location: '19 Avenue Kléber, 75116 Paris',
                  rating: 5,
                  review: 'Belle Époque building with modern luxury and rooftop restaurant.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'Guy Savoy',
                  location: '11 Quai de Conti, 75006 Paris',
                  rating: 5,
                  review: 'Three Michelin stars. Exceptional French cuisine with innovative techniques.',
                  liked: true
                },
                {
                  name: 'L\'Ambroisie',
                  location: '9 Place des Vosges, 75004 Paris',
                  rating: 5,
                  review: 'Three Michelin stars. Classic French haute cuisine in historic setting.',
                  liked: true
                },
                {
                  name: 'Le Comptoir du Relais',
                  location: '9 Carrefour de l\'Odéon, 75006 Paris',
                  rating: 4,
                  review: 'Bistro with excellent French classics. Popular with locals and tourists.',
                  liked: true
                },
                {
                  name: 'L\'Astrance',
                  location: '4 Rue Beethoven, 75016 Paris',
                  rating: 5,
                  review: 'Three Michelin stars. Innovative French-Asian fusion cuisine.',
                  liked: true
                },
                {
                  name: 'Le Jules Verne',
                  location: 'Eiffel Tower, 75007 Paris',
                  rating: 5,
                  review: 'Fine dining in the Eiffel Tower with spectacular city views.',
                  liked: true
                },
                {
                  name: 'Septime',
                  location: '80 Rue de Charonne, 75011 Paris',
                  rating: 4,
                  review: 'Modern bistro with creative French cuisine. One Michelin star.',
                  liked: true
                },
                {
                  name: 'Le Chateaubriand',
                  location: '129 Avenue Parmentier, 75011 Paris',
                  rating: 4,
                  review: 'Innovative bistro cuisine. One Michelin star. No reservations policy.',
                  liked: true
                },
                {
                  name: 'Pierre Gagnaire',
                  location: '6 Rue Balzac, 75008 Paris',
                  rating: 5,
                  review: 'Three Michelin stars. Avant-garde French cuisine with creative presentations.',
                  liked: true
                },
                {
                  name: 'L\'Arpège',
                  location: '84 Rue de Varenne, 75007 Paris',
                  rating: 5,
                  review: 'Three Michelin stars. Vegetable-focused cuisine by Alain Passard.',
                  liked: true
                },
                {
                  name: 'Bouillon Chartier',
                  location: '7 Rue du Faubourg Montmartre, 75009 Paris',
                  rating: 4,
                  review: 'Historic brasserie since 1896. Traditional French food at great value.',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'Eiffel Tower',
                  location: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
                  rating: 5,
                  review: 'Iconic symbol of Paris. Stunning views from the top. Must-visit landmark.',
                  liked: true
                },
                {
                  name: 'Louvre Museum',
                  location: 'Rue de Rivoli, 75001 Paris',
                  rating: 5,
                  review: 'World\'s largest art museum. Home to Mona Lisa and countless masterpieces.',
                  liked: true
                },
                {
                  name: 'Notre-Dame Cathedral',
                  location: '6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris',
                  rating: 5,
                  review: 'Gothic masterpiece. Beautiful architecture and rich history.',
                  liked: true
                },
                {
                  name: 'Arc de Triomphe',
                  location: 'Place Charles de Gaulle, 75008 Paris',
                  rating: 5,
                  review: 'Monumental arch with panoramic views. Champs-Élysées starts here.',
                  liked: true
                },
                {
                  name: 'Montmartre & Sacré-Cœur',
                  location: '35 Rue du Chevalier de la Barre, 75018 Paris',
                  rating: 5,
                  review: 'Historic hilltop neighborhood. Beautiful basilica and artistic atmosphere.',
                  liked: true
                },
                {
                  name: 'Seine River Cruise',
                  location: 'Various departure points along Seine',
                  rating: 4,
                  review: 'Scenic boat tour passing major landmarks. Best at sunset.',
                  liked: true
                },
                {
                  name: 'Musée d\'Orsay',
                  location: '1 Rue de la Légion d\'Honneur, 75007 Paris',
                  rating: 5,
                  review: 'Impressionist masterpieces in beautiful former railway station.',
                  liked: true
                },
                {
                  name: 'Champs-Élysées',
                  location: 'Avenue des Champs-Élysées, 75008 Paris',
                  rating: 4,
                  review: 'Famous avenue with shops, cafes, and theaters. Iconic Parisian experience.',
                  liked: true
                },
                {
                  name: 'Versailles Palace',
                  location: 'Place d\'Armes, 78000 Versailles',
                  rating: 5,
                  review: 'Opulent royal palace with stunning gardens. Day trip from Paris.',
                  liked: true
                },
                {
                  name: 'Latin Quarter',
                  location: '5th arrondissement, Paris',
                  rating: 4,
                  review: 'Historic neighborhood with narrow streets, bookshops, and cafes.',
                  liked: true
                }
              ]
            }
          },
          // New York, United States - Top 10 hotels
          {
            name: 'New York',
            country: 'United States',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'The Plaza',
                  location: '768 5th Ave, New York, NY 10019',
                  rating: 5,
                  review: 'Legendary hotel on Central Park. Classic elegance meets modern luxury.',
                  liked: true
                },
                {
                  name: 'The St. Regis New York',
                  location: '2 E 55th St, New York, NY 10022',
                  rating: 5,
                  review: 'Iconic Fifth Avenue hotel with butler service and timeless elegance.',
                  liked: true
                },
                {
                  name: 'Four Seasons Hotel New York',
                  location: '57 E 57th St, New York, NY 10022',
                  rating: 5,
                  review: 'Luxury hotel in Midtown with spacious rooms and exceptional service.',
                  liked: true
                },
                {
                  name: 'The Ritz-Carlton New York, Central Park',
                  location: '50 Central Park S, New York, NY 10019',
                  rating: 5,
                  review: 'Prime location overlooking Central Park with sophisticated luxury.',
                  liked: true
                },
                {
                  name: 'The Mark New York',
                  location: '25 E 77th St, New York, NY 10075',
                  rating: 5,
                  review: 'Upper East Side luxury with contemporary design and excellent dining.',
                  liked: true
                },
                {
                  name: 'The Carlyle, A Rosewood Hotel',
                  location: '35 E 76th St, New York, NY 10021',
                  rating: 5,
                  review: 'Art Deco landmark with legendary Bemelmans Bar and elegant rooms.',
                  liked: true
                },
                {
                  name: 'Mandarin Oriental New York',
                  location: '80 Columbus Circle, New York, NY 10023',
                  rating: 5,
                  review: 'Modern luxury with stunning views of Central Park and the city.',
                  liked: true
                },
                {
                  name: 'The Langham New York',
                  location: '400 5th Ave, New York, NY 10018',
                  rating: 4,
                  review: 'Contemporary hotel in Midtown with excellent location and modern amenities.',
                  liked: true
                },
                {
                  name: 'The Greenwich Hotel',
                  location: '377 Greenwich St, New York, NY 10013',
                  rating: 5,
                  review: 'Boutique hotel in Tribeca with unique design and intimate atmosphere.',
                  liked: true
                },
                {
                  name: 'The Beekman, A Thompson Hotel',
                  location: '123 Nassau St, New York, NY 10038',
                  rating: 4,
                  review: 'Historic building with modern luxury in the Financial District.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'Le Bernardin',
                  location: '155 W 51st St, New York, NY 10019',
                  rating: 5,
                  review: 'Three Michelin stars. Exceptional seafood-focused French cuisine.',
                  liked: true
                },
                {
                  name: 'Eleven Madison Park',
                  location: '11 Madison Ave, New York, NY 10010',
                  rating: 5,
                  review: 'Three Michelin stars. Plant-based fine dining with innovative techniques.',
                  liked: true
                },
                {
                  name: 'Per Se',
                  location: '10 Columbus Circle, New York, NY 10019',
                  rating: 5,
                  review: 'Three Michelin stars. Thomas Keller\'s refined French-American cuisine.',
                  liked: true
                },
                {
                  name: 'Daniel',
                  location: '60 E 65th St, New York, NY 10065',
                  rating: 5,
                  review: 'Two Michelin stars. Classic French cuisine with modern touches.',
                  liked: true
                },
                {
                  name: 'Peter Luger Steak House',
                  location: '178 Broadway, Brooklyn, NY 11211',
                  rating: 5,
                  review: 'Legendary steakhouse since 1887. Cash only. Famous porterhouse.',
                  liked: true
                },
                {
                  name: 'Katz\'s Delicatessen',
                  location: '205 E Houston St, New York, NY 10002',
                  rating: 4,
                  review: 'Iconic Jewish deli since 1888. Famous pastrami sandwiches.',
                  liked: true
                },
                {
                  name: 'The Modern',
                  location: '9 W 53rd St, New York, NY 10019',
                  rating: 5,
                  review: 'Two Michelin stars. Contemporary French-American cuisine at MoMA.',
                  liked: true
                },
                {
                  name: 'Jean-Georges',
                  location: '1 Central Park W, New York, NY 10023',
                  rating: 5,
                  review: 'Three Michelin stars. Innovative French-Asian fusion with Central Park views.',
                  liked: true
                },
                {
                  name: 'Gramercy Tavern',
                  location: '42 E 20th St, New York, NY 10003',
                  rating: 4,
                  review: 'One Michelin star. Seasonal American cuisine in warm, welcoming setting.',
                  liked: true
                },
                {
                  name: 'Lucali',
                  location: '575 Henry St, Brooklyn, NY 11231',
                  rating: 5,
                  review: 'Best pizza in NYC. Thin crust, wood-fired. Cash only. Long waits.',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'Statue of Liberty',
                  location: 'Liberty Island, New York, NY 10004',
                  rating: 5,
                  review: 'Iconic symbol of freedom. Ferry ride offers great views of Manhattan.',
                  liked: true
                },
                {
                  name: 'Central Park',
                  location: 'New York, NY',
                  rating: 5,
                  review: '843-acre urban park. Perfect for walking, biking, and relaxation.',
                  liked: true
                },
                {
                  name: 'Empire State Building',
                  location: '350 5th Ave, New York, NY 10118',
                  rating: 5,
                  review: 'Art Deco skyscraper with stunning 360-degree city views.',
                  liked: true
                },
                {
                  name: 'Times Square',
                  location: 'Manhattan, NY 10036',
                  rating: 4,
                  review: 'Vibrant entertainment hub. Bright lights, Broadway shows, and energy.',
                  liked: true
                },
                {
                  name: 'Brooklyn Bridge',
                  location: 'Brooklyn Bridge, New York, NY 10038',
                  rating: 5,
                  review: 'Historic suspension bridge. Beautiful walk with Manhattan skyline views.',
                  liked: true
                },
                {
                  name: 'Metropolitan Museum of Art',
                  location: '1000 5th Ave, New York, NY 10028',
                  rating: 5,
                  review: 'One of world\'s largest art museums. Extensive collections from all cultures.',
                  liked: true
                },
                {
                  name: 'High Line',
                  location: 'New York, NY 10011',
                  rating: 5,
                  review: 'Elevated park built on former railway. Unique urban green space.',
                  liked: true
                },
                {
                  name: '9/11 Memorial & Museum',
                  location: '180 Greenwich St, New York, NY 10007',
                  rating: 5,
                  review: 'Moving tribute to victims. Powerful and emotional experience.',
                  liked: true
                },
                {
                  name: 'Broadway Show',
                  location: 'Theater District, Manhattan',
                  rating: 5,
                  review: 'World-class theater productions. Must-see for theater lovers.',
                  liked: true
                },
                {
                  name: 'One World Observatory',
                  location: '285 Fulton St, New York, NY 10007',
                  rating: 5,
                  review: 'Top of One World Trade Center. Breathtaking views of NYC.',
                  liked: true
                }
              ]
            }
          },
          // London, United Kingdom - Top 10 hotels
          {
            name: 'London',
            country: 'United Kingdom',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'The Savoy',
                  location: 'Strand, London WC2R 0EU',
                  rating: 5,
                  review: 'Historic luxury hotel on the Thames. Classic British elegance.',
                  liked: true
                },
                {
                  name: 'Claridge\'s',
                  location: 'Brook Street, London W1K 4HR',
                  rating: 5,
                  review: 'Art Deco masterpiece in Mayfair with legendary afternoon tea.',
                  liked: true
                },
                {
                  name: 'The Ritz London',
                  location: '150 Piccadilly, London W1J 9BR',
                  rating: 5,
                  review: 'Iconic hotel with opulent interiors and world-famous afternoon tea.',
                  liked: true
                },
                {
                  name: 'The Connaught',
                  location: 'Carlos Place, London W1K 2AL',
                  rating: 5,
                  review: 'Elegant Mayfair hotel with Michelin-starred dining and timeless luxury.',
                  liked: true
                },
                {
                  name: 'The Langham London',
                  location: '1C Portland Place, London W1B 1JA',
                  rating: 5,
                  review: 'Historic hotel with modern luxury and excellent location in Marylebone.',
                  liked: true
                },
                {
                  name: 'Shangri-La Hotel at The Shard',
                  location: '31 St Thomas St, London SE1 9QU',
                  rating: 5,
                  review: 'Ultra-modern hotel in The Shard with breathtaking city views.',
                  liked: true
                },
                {
                  name: 'Four Seasons Hotel London at Park Lane',
                  location: 'Hamilton Place, London W1J 7DR',
                  rating: 5,
                  review: 'Luxury hotel in Mayfair with elegant rooms and exceptional service.',
                  liked: true
                },
                {
                  name: 'The Goring',
                  location: '15 Beeston Place, London SW1W 0JW',
                  rating: 5,
                  review: 'Family-owned luxury hotel near Buckingham Palace with British charm.',
                  liked: true
                },
                {
                  name: 'The Dorchester',
                  location: '53 Park Lane, London W1K 1QA',
                  rating: 5,
                  review: 'Iconic Park Lane hotel with legendary service and Michelin-starred dining.',
                  liked: true
                },
                {
                  name: 'Rosewood London',
                  location: '252 High Holborn, London WC1V 7EN',
                  rating: 5,
                  review: 'Elegant hotel in Holborn with sophisticated design and excellent dining.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'The Ledbury',
                  location: '127 Ledbury Rd, London W11 2AQ',
                  rating: 5,
                  review: 'Two Michelin stars. Modern European cuisine with exceptional technique.',
                  liked: true
                },
                {
                  name: 'Dishoom',
                  location: '5 Stable St, London N1C 4AB',
                  rating: 4,
                  review: 'Popular Indian restaurant inspired by Bombay cafes. Great breakfast.',
                  liked: true
                },
                {
                  name: 'The Clove Club',
                  location: '380 Old St, London EC1V 9LT',
                  rating: 5,
                  review: 'One Michelin star. Modern British cuisine with innovative presentations.',
                  liked: true
                },
                {
                  name: 'St. John',
                  location: '26 St John St, London EC1M 4AY',
                  rating: 4,
                  review: 'Nose-to-tail dining. Classic British food with focus on offal.',
                  liked: true
                },
                {
                  name: 'Core by Clare Smyth',
                  location: '92 Kensington Park Rd, London W11 2PN',
                  rating: 5,
                  review: 'Three Michelin stars. Refined British cuisine by first female chef to hold three stars.',
                  liked: true
                },
                {
                  name: 'Borough Market',
                  location: '8 Southwark St, London SE1 1TL',
                  rating: 4,
                  review: 'Historic food market. Great for street food, cheese, and fresh produce.',
                  liked: true
                },
                {
                  name: 'The Ivy',
                  location: '1-5 West St, London WC2H 9NQ',
                  rating: 4,
                  review: 'Iconic restaurant with classic British and European dishes.',
                  liked: true
                },
                {
                  name: 'Hawksmoor',
                  location: '11 Langley St, London WC2H 9JG',
                  rating: 5,
                  review: 'Best steakhouse in London. Excellent cocktails and sides.',
                  liked: true
                },
                {
                  name: 'Padella',
                  location: '6 Southwark St, London SE1 1TQ',
                  rating: 4,
                  review: 'Fresh pasta restaurant. No reservations. Worth the wait.',
                  liked: true
                },
                {
                  name: 'Duck & Waffle',
                  location: '110 Bishopsgate, London EC2N 4AY',
                  rating: 4,
                  review: '24-hour restaurant on 40th floor. Great views and creative dishes.',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'British Museum',
                  location: 'Great Russell St, London WC1B 3DG',
                  rating: 5,
                  review: 'World\'s largest history museum. Rosetta Stone and Egyptian mummies.',
                  liked: true
                },
                {
                  name: 'Tower of London',
                  location: 'London EC3N 4AB',
                  rating: 5,
                  review: 'Historic castle with Crown Jewels. Rich history and Beefeater tours.',
                  liked: true
                },
                {
                  name: 'Buckingham Palace',
                  location: 'Westminster, London SW1A 1AA',
                  rating: 5,
                  review: 'Royal residence. Changing of the Guard ceremony is spectacular.',
                  liked: true
                },
                {
                  name: 'Westminster Abbey',
                  location: '20 Deans Yd, London SW1P 3PA',
                  rating: 5,
                  review: 'Gothic abbey. Coronation church and burial place of monarchs.',
                  liked: true
                },
                {
                  name: 'London Eye',
                  location: 'Lambeth, London SE1 7PB',
                  rating: 4,
                  review: 'Giant observation wheel. Panoramic views of London skyline.',
                  liked: true
                },
                {
                  name: 'Tate Modern',
                  location: 'Bankside, London SE1 9TG',
                  rating: 5,
                  review: 'World\'s most visited modern art gallery. Free entry.',
                  liked: true
                },
                {
                  name: 'Hyde Park',
                  location: 'London',
                  rating: 4,
                  review: 'Large royal park. Serpentine Lake, Speakers\' Corner, and peaceful walks.',
                  liked: true
                },
                {
                  name: 'St. Paul\'s Cathedral',
                  location: 'St. Paul\'s Churchyard, London EC4M 8AD',
                  rating: 5,
                  review: 'Baroque masterpiece. Climb to the dome for stunning views.',
                  liked: true
                },
                {
                  name: 'Covent Garden',
                  location: 'London WC2E 8RF',
                  rating: 4,
                  review: 'Vibrant area with street performers, shops, and restaurants.',
                  liked: true
                },
                {
                  name: 'Shakespeare\'s Globe',
                  location: '21 New Globe Walk, London SE1 9DT',
                  rating: 4,
                  review: 'Reconstruction of original Globe Theatre. Watch plays as Shakespeare intended.',
                  liked: true
                }
              ]
            }
          },
          // Rome, Italy - Top 10 hotels
          {
            name: 'Rome',
            country: 'Italy',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'Hotel de Russie',
                  location: 'Via del Babuino, 9, 00187 Roma',
                  rating: 5,
                  review: 'Luxury hotel near Spanish Steps with beautiful secret garden.',
                  liked: true
                },
                {
                  name: 'The First Roma Dolce',
                  location: 'Via del Corso, 126, 00186 Roma',
                  rating: 5,
                  review: 'Boutique hotel on Via del Corso with elegant design and excellent location.',
                  liked: true
                },
                {
                  name: 'Hotel Hassler Roma',
                  location: 'Piazza Trinità dei Monti, 6, 00187 Roma',
                  rating: 5,
                  review: 'Iconic hotel at the top of Spanish Steps with stunning city views.',
                  liked: true
                },
                {
                  name: 'Palazzo Naiadi Rome',
                  location: 'Piazza della Repubblica, 47, 00185 Roma',
                  rating: 5,
                  review: 'Luxury hotel near Termini with elegant rooms and excellent service.',
                  liked: true
                },
                {
                  name: 'The First Roma Arte',
                  location: 'Via del Vantaggio, 14, 00186 Roma',
                  rating: 5,
                  review: 'Art-themed boutique hotel with contemporary design and prime location.',
                  liked: true
                },
                {
                  name: 'Villa San Pio',
                  location: 'Via di Santa Melania, 19, 00153 Roma',
                  rating: 4,
                  review: 'Elegant villa hotel in Aventine Hill with peaceful gardens.',
                  liked: true
                },
                {
                  name: 'Hotel Artemide',
                  location: 'Via Nazionale, 22, 00184 Roma',
                  rating: 4,
                  review: 'Modern hotel near Termini with excellent amenities and good value.',
                  liked: true
                },
                {
                  name: 'The First Roma Dolce',
                  location: 'Via del Corso, 126, 00186 Roma',
                  rating: 5,
                  review: 'Luxury boutique hotel with sophisticated design and excellent dining.',
                  liked: true
                },
                {
                  name: 'Palazzo Dama',
                  location: 'Lungotevere delle Armi, 20, 00195 Roma',
                  rating: 5,
                  review: 'Boutique hotel on the Tiber with contemporary luxury and art collection.',
                  liked: true
                },
                {
                  name: 'Hotel de la Ville',
                  location: 'Via Sistina, 69, 00187 Roma',
                  rating: 5,
                  review: 'Elegant hotel near Spanish Steps with rooftop bar and city views.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'La Pergola',
                  location: 'Via Alberto Cadlolo, 101, 00136 Roma',
                  rating: 5,
                  review: 'Three Michelin stars. Fine dining with panoramic city views.',
                  liked: true
                },
                {
                  name: 'Roscioli',
                  location: 'Via dei Giubbonari, 21, 00186 Roma',
                  rating: 4,
                  review: 'Historic deli and restaurant. Excellent pasta, pizza, and cured meats.',
                  liked: true
                },
                {
                  name: 'Armando al Pantheon',
                  location: 'Salita dei Crescenzi, 31, 00186 Roma',
                  rating: 4,
                  review: 'Traditional Roman trattoria near Pantheon. Classic pasta dishes.',
                  liked: true
                },
                {
                  name: 'Da Enzo al 29',
                  location: 'Via dei Vascellari, 29, 00153 Roma',
                  rating: 4,
                  review: 'Authentic Roman cuisine in Trastevere. Great carbonara and amatriciana.',
                  liked: true
                },
                {
                  name: 'Pizzarium',
                  location: 'Via della Meloria, 43, 00136 Roma',
                  rating: 4,
                  review: 'Best pizza al taglio in Rome. Creative toppings by Gabriele Bonci.',
                  liked: true
                },
                {
                  name: 'Trattoria Da Cesare al Casaletto',
                  location: 'Via del Casaletto, 45, 00151 Roma',
                  rating: 4,
                  review: 'Traditional Roman food. Excellent cacio e pepe and trippa alla romana.',
                  liked: true
                },
                {
                  name: 'La Taverna dei Fori Imperiali',
                  location: 'Via della Madonna dei Monti, 9, 00184 Roma',
                  rating: 4,
                  review: 'Roman classics near Colosseum. Great value and authentic flavors.',
                  liked: true
                },
                {
                  name: 'Osteria Bonelli',
                  location: 'Via di S. Giovanni in Laterano, 132, 00184 Roma',
                  rating: 4,
                  review: 'Traditional osteria with Roman specialties. Friendly atmosphere.',
                  liked: true
                },
                {
                  name: 'Felice a Testaccio',
                  location: 'Via Mastro Giorgio, 29, 00153 Roma',
                  rating: 4,
                  review: 'Historic trattoria in Testaccio. Famous for tonnarelli cacio e pepe.',
                  liked: true
                },
                {
                  name: 'Il Pagliaccio',
                  location: 'Via dei Banchi Vecchi, 129a, 00186 Roma',
                  rating: 5,
                  review: 'Two Michelin stars. Creative Italian cuisine with modern techniques.',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'Colosseum',
                  location: 'Piazza del Colosseo, 1, 00184 Roma',
                  rating: 5,
                  review: 'Ancient Roman amphitheater. Iconic symbol of Rome. Must-see.',
                  liked: true
                },
                {
                  name: 'Vatican Museums & Sistine Chapel',
                  location: '00120 Vatican City',
                  rating: 5,
                  review: 'Renaissance masterpieces. Michelangelo\'s ceiling is breathtaking.',
                  liked: true
                },
                {
                  name: 'Trevi Fountain',
                  location: 'Piazza di Trevi, 00187 Roma',
                  rating: 5,
                  review: 'Baroque masterpiece. Throw a coin to ensure your return to Rome.',
                  liked: true
                },
                {
                  name: 'Pantheon',
                  location: 'Piazza della Rotonda, 00186 Roma',
                  rating: 5,
                  review: 'Best-preserved Roman building. Incredible dome architecture.',
                  liked: true
                },
                {
                  name: 'Roman Forum',
                  location: 'Via della Salara Vecchia, 5/6, 00186 Roma',
                  rating: 5,
                  review: 'Ancient Roman ruins. Walk through history of the Roman Empire.',
                  liked: true
                },
                {
                  name: 'Spanish Steps',
                  location: 'Piazza di Spagna, 00187 Roma',
                  rating: 4,
                  review: 'Famous staircase. Great for people-watching and photos.',
                  liked: true
                },
                {
                  name: 'Villa Borghese',
                  location: 'Piazzale Napoleone I, 00197 Roma',
                  rating: 4,
                  review: 'Beautiful park with art gallery. Perfect for a peaceful stroll.',
                  liked: true
                },
                {
                  name: 'Trastevere',
                  location: 'Trastevere, 00153 Roma',
                  rating: 4,
                  review: 'Charming neighborhood with narrow streets, restaurants, and nightlife.',
                  liked: true
                },
                {
                  name: 'St. Peter\'s Basilica',
                  location: 'Piazza San Pietro, 00120 Vatican City',
                  rating: 5,
                  review: 'Largest church in the world. Climb the dome for amazing views.',
                  liked: true
                },
                {
                  name: 'Piazza Navona',
                  location: 'Piazza Navona, 00186 Roma',
                  rating: 4,
                  review: 'Beautiful square with fountains, cafes, and street artists.',
                  liked: true
                }
              ]
            }
          },
          // Barcelona, Spain - Top 10 hotels
          {
            name: 'Barcelona',
            country: 'Spain',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'Hotel Arts Barcelona',
                  location: 'Carrer de la Marina, 19-21, 08005 Barcelona',
                  rating: 5,
                  review: 'Luxury beachfront hotel with stunning Mediterranean views.',
                  liked: true
                },
                {
                  name: 'Mandarin Oriental Barcelona',
                  location: 'Passeig de Gràcia, 38-40, 08007 Barcelona',
                  rating: 5,
                  review: 'Modern luxury on Passeig de Gràcia with excellent dining and spa.',
                  liked: true
                },
                {
                  name: 'El Palace Barcelona',
                  location: 'Gran Via de les Corts Catalanes, 668, 08013 Barcelona',
                  rating: 5,
                  review: 'Historic palace hotel with elegant rooms and rooftop pool.',
                  liked: true
                },
                {
                  name: 'Casa Fuster',
                  location: 'Passeig de Gràcia, 132, 08008 Barcelona',
                  rating: 5,
                  review: 'Modernist landmark hotel with sophisticated design and prime location.',
                  liked: true
                },
                {
                  name: 'The Serras Barcelona',
                  location: 'Passeig de Colom, 9, 08002 Barcelona',
                  rating: 5,
                  review: 'Boutique hotel in Gothic Quarter with rooftop pool and city views.',
                  liked: true
                },
                {
                  name: 'Hotel Omm',
                  location: 'Carrer del Rosselló, 265, 08008 Barcelona',
                  rating: 4,
                  review: 'Design hotel in Eixample with modern amenities and excellent dining.',
                  liked: true
                },
                {
                  name: 'W Barcelona',
                  location: 'Plaça Rosa dels Vents, 1, 08039 Barcelona',
                  rating: 4,
                  review: 'Iconic sail-shaped hotel on the beach with vibrant atmosphere.',
                  liked: true
                },
                {
                  name: 'Majestic Hotel & Spa Barcelona',
                  location: 'Passeig de Gràcia, 68, 08007 Barcelona',
                  rating: 5,
                  review: 'Elegant hotel on Passeig de Gràcia with rooftop pool and spa.',
                  liked: true
                },
                {
                  name: 'Cotton House Hotel',
                  location: 'Gran Via de les Corts Catalanes, 670, 08013 Barcelona',
                  rating: 5,
                  review: 'Boutique hotel in former textile palace with elegant design.',
                  liked: true
                },
                {
                  name: 'Hotel Casa Camper',
                  location: 'Carrer d\'Elisabets, 11, 08001 Barcelona',
                  rating: 4,
                  review: 'Design hotel in Raval with unique concept and excellent service.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'El Celler de Can Roca',
                  location: 'Carrer de Can Sunyer, 48, 17007 Girona',
                  rating: 5,
                  review: 'Three Michelin stars. Innovative Catalan cuisine. World\'s best restaurant 2013.',
                  liked: true
                },
                {
                  name: 'Disfrutar',
                  location: 'Carrer de Villarroel, 163, 08036 Barcelona',
                  rating: 5,
                  review: 'Two Michelin stars. Creative molecular gastronomy. Exceptional experience.',
                  liked: true
                },
                {
                  name: 'Tickets',
                  location: 'Avinguda del Paral·lel, 164, 08015 Barcelona',
                  rating: 5,
                  review: 'One Michelin star. Tapas with creative twists by Ferran Adrià\'s brother.',
                  liked: true
                },
                {
                  name: 'Cal Pep',
                  location: 'Plaça de les Olles, 8, 08003 Barcelona',
                  rating: 4,
                  review: 'Legendary tapas bar. No reservations. Worth the wait for authentic flavors.',
                  liked: true
                },
                {
                  name: 'Can Culleretes',
                  location: 'Carrer d\'en Quintana, 5, 08002 Barcelona',
                  rating: 4,
                  review: 'Oldest restaurant in Barcelona (1786). Traditional Catalan cuisine.',
                  liked: true
                },
                {
                  name: 'Bar Mut',
                  location: 'Carrer de Pau Claris, 192, 08037 Barcelona',
                  rating: 4,
                  review: 'Upscale tapas bar. Excellent seafood and creative small plates.',
                  liked: true
                },
                {
                  name: 'Quimet & Quimet',
                  location: 'Carrer del Poeta Cabanyes, 25, 08004 Barcelona',
                  rating: 4,
                  review: 'Tiny tapas bar with amazing montaditos. Standing room only.',
                  liked: true
                },
                {
                  name: 'Els Quatre Gats',
                  location: 'Carrer de Montsió, 3, 08002 Barcelona',
                  rating: 4,
                  review: 'Historic Modernista cafe. Picasso\'s first exhibition was here.',
                  liked: true
                },
                {
                  name: 'Cervecería Catalana',
                  location: 'Carrer de Mallorca, 236, 08008 Barcelona',
                  rating: 4,
                  review: 'Popular tapas restaurant. Great variety and quality. Always busy.',
                  liked: true
                },
                {
                  name: 'ABaC',
                  location: 'Avinguda del Tibidabo, 1, 08022 Barcelona',
                  rating: 5,
                  review: 'Three Michelin stars. Fine dining with innovative Catalan cuisine.',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'Sagrada Família',
                  location: 'Carrer de Mallorca, 401, 08013 Barcelona',
                  rating: 5,
                  review: 'Gaudí\'s unfinished masterpiece. Stunning architecture and stained glass.',
                  liked: true
                },
                {
                  name: 'Park Güell',
                  location: '08024 Barcelona',
                  rating: 5,
                  review: 'Colorful park designed by Gaudí. Mosaic sculptures and city views.',
                  liked: true
                },
                {
                  name: 'La Rambla',
                  location: 'La Rambla, 08002 Barcelona',
                  rating: 4,
                  review: 'Famous pedestrian street. Street performers, shops, and cafes.',
                  liked: true
                },
                {
                  name: 'Gothic Quarter',
                  location: 'Barri Gòtic, 08002 Barcelona',
                  rating: 4,
                  review: 'Medieval neighborhood with narrow streets, cathedrals, and history.',
                  liked: true
                },
                {
                  name: 'Casa Batlló',
                  location: 'Passeig de Gràcia, 43, 08007 Barcelona',
                  rating: 5,
                  review: 'Gaudí\'s architectural wonder. Dragon-inspired design.',
                  liked: true
                },
                {
                  name: 'Camp Nou',
                  location: 'C. d\'Aristides Maillol, 12, 08028 Barcelona',
                  rating: 5,
                  review: 'FC Barcelona stadium. Tour the museum and pitch.',
                  liked: true
                },
                {
                  name: 'Montjuïc',
                  location: 'Montjuïc, Barcelona',
                  rating: 4,
                  review: 'Hill with museums, gardens, and Magic Fountain light show.',
                  liked: true
                },
                {
                  name: 'Barceloneta Beach',
                  location: 'Barceloneta, 08003 Barcelona',
                  rating: 4,
                  review: 'Popular city beach. Great for sunbathing and beach bars.',
                  liked: true
                },
                {
                  name: 'Picasso Museum',
                  location: 'Carrer Montcada, 15-23, 08003 Barcelona',
                  rating: 5,
                  review: 'Extensive collection of Picasso\'s early works.',
                  liked: true
                },
                {
                  name: 'Casa Milà (La Pedrera)',
                  location: 'Passeig de Gràcia, 92, 08008 Barcelona',
                  rating: 5,
                  review: 'Gaudí\'s last private residence. Unique undulating facade.',
                  liked: true
                }
              ]
            }
          },
          // Bangkok, Thailand - Top 10 hotels
          {
            name: 'Bangkok',
            country: 'Thailand',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'Mandarin Oriental Bangkok',
                  location: '48 Oriental Ave, Khwaeng Bang Rak, Bangkok 10500',
                  rating: 5,
                  review: 'Legendary riverside hotel with traditional Thai hospitality.',
                  liked: true
                },
                {
                  name: 'The Peninsula Bangkok',
                  location: '333 Charoennakorn Road, Khlong San, Bangkok 10600',
                  rating: 5,
                  review: 'Luxury riverside hotel with stunning views and exceptional service.',
                  liked: true
                },
                {
                  name: 'The Siam',
                  location: '3/2 Thanon Khao, Vachirapayabal, Dusit, Bangkok 10300',
                  rating: 5,
                  review: 'Boutique hotel with Art Deco design and riverside location.',
                  liked: true
                },
                {
                  name: 'Capella Bangkok',
                  location: '300/2 Charoen Krung Road, Khwaeng Yan Nawa, Bangkok 10120',
                  rating: 5,
                  review: 'Ultra-luxury riverside hotel with contemporary design and world-class dining.',
                  liked: true
                },
                {
                  name: 'The St. Regis Bangkok',
                  location: '159 Ratchadamri Rd, Khwaeng Lumphini, Bangkok 10330',
                  rating: 5,
                  review: 'Luxury hotel in central Bangkok with butler service and excellent amenities.',
                  liked: true
                },
                {
                  name: 'Four Seasons Hotel Bangkok',
                  location: '300/1 Charoen Krung Road, Khwaeng Yan Nawa, Bangkok 10120',
                  rating: 5,
                  review: 'Modern luxury hotel with riverside location and exceptional dining.',
                  liked: true
                },
                {
                  name: 'Shangri-La Bangkok',
                  location: '89 Soi Wat Suan Plu, Charoen Krung Road, Bangkok 10500',
                  rating: 5,
                  review: 'Riverside luxury with traditional Thai design and excellent service.',
                  liked: true
                },
                {
                  name: 'The Sukhothai Bangkok',
                  location: '13/3 South Sathorn Road, Khwaeng Thung Maha Mek, Bangkok 10120',
                  rating: 5,
                  review: 'Elegant hotel with traditional Thai architecture and peaceful gardens.',
                  liked: true
                },
                {
                  name: 'Park Hyatt Bangkok',
                  location: 'Central Embassy, 88 Wireless Rd, Khwaeng Lumphini, Bangkok 10330',
                  rating: 5,
                  review: 'Modern luxury hotel in Central Embassy with sophisticated design.',
                  liked: true
                },
                {
                  name: 'Waldorf Astoria Bangkok',
                  location: '151 Ratchadamri Rd, Khwaeng Lumphini, Bangkok 10330',
                  rating: 5,
                  review: 'Luxury hotel with contemporary design and excellent dining options.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'Gaggan',
                  location: '68/4 Soi Langsuan, Khwaeng Lumphini, Bangkok 10330',
                  rating: 5,
                  review: 'Progressive Indian cuisine. Two Michelin stars. World\'s best restaurant 2015.',
                  liked: true
                },
                {
                  name: 'Jay Fai',
                  location: '327 Maha Chai Rd, Khwaeng Samran Rat, Bangkok 10200',
                  rating: 5,
                  review: 'One Michelin star. Street food legend. Famous for crab omelet and tom yum.',
                  liked: true
                },
                {
                  name: 'Le Du',
                  location: '399/3 Silom Soi 7, Khwaeng Silom, Bangkok 10500',
                  rating: 5,
                  review: 'One Michelin star. Modern Thai cuisine with French techniques.',
                  liked: true
                },
                {
                  name: 'Sorn',
                  location: '56 Sukhumvit 26, Khwaeng Khlong Tan, Bangkok 10110',
                  rating: 5,
                  review: 'Two Michelin stars. Southern Thai cuisine. Extremely hard to book.',
                  liked: true
                },
                {
                  name: 'Thip Samai',
                  location: '313-315 Maha Chai Rd, Khwaeng Samran Rat, Bangkok 10200',
                  rating: 4,
                  review: 'Best pad thai in Bangkok. Open late. Always a queue.',
                  liked: true
                },
                {
                  name: 'Bo.lan',
                  location: '24 Sukhumvit 53, Khwaeng Khlong Tan Nuea, Bangkok 10110',
                  rating: 4,
                  review: 'One Michelin star. Traditional Thai cuisine with focus on sustainability.',
                  liked: true
                },
                {
                  name: 'Err',
                  location: '394/35 Maha Rat Rd, Khwaeng Phra Borom Maha Ratchawang, Bangkok 10200',
                  rating: 4,
                  review: 'Rustic Thai food. Great for traditional dishes and local flavors.',
                  liked: true
                },
                {
                  name: 'Nahm',
                  location: '27 S Sathorn Rd, Khwaeng Thung Maha Mek, Bangkok 10120',
                  rating: 5,
                  review: 'One Michelin star. Refined Thai cuisine by David Thompson.',
                  liked: true
                },
                {
                  name: 'Raan Jay Fai',
                  location: '327 Maha Chai Rd, Khwaeng Samran Rat, Bangkok 10200',
                  rating: 4,
                  review: 'Street food legend. Famous for wok-fried dishes. Cash only.',
                  liked: true
                },
                {
                  name: 'Paste',
                  location: '120/26 Gaysorn, 999 Ploenchit Rd, Khwaeng Lumphini, Bangkok 10330',
                  rating: 4,
                  review: 'One Michelin star. Refined Thai cuisine with modern presentation.',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'Grand Palace',
                  location: 'Na Phra Lan Rd, Phra Nakhon, Bangkok 10200',
                  rating: 5,
                  review: 'Former royal residence. Stunning architecture and Emerald Buddha.',
                  liked: true
                },
                {
                  name: 'Wat Pho (Temple of Reclining Buddha)',
                  location: '2 Sanam Chai Rd, Phra Borom Maha Ratchawang, Bangkok 10200',
                  rating: 5,
                  review: '46-meter reclining Buddha. Traditional Thai massage school.',
                  liked: true
                },
                {
                  name: 'Chatuchak Weekend Market',
                  location: '587/10 Kamphaeng Phet 2 Rd, Chatuchak, Bangkok 10900',
                  rating: 4,
                  review: 'World\'s largest weekend market. Everything from food to souvenirs.',
                  liked: true
                },
                {
                  name: 'Wat Arun (Temple of Dawn)',
                  location: '158 Thanon Wang Doem, Wat Arun, Bangkok Yai, Bangkok 10600',
                  rating: 5,
                  review: 'Iconic riverside temple. Beautiful at sunset.',
                  liked: true
                },
                {
                  name: 'Floating Markets',
                  location: 'Damnoen Saduak, Ratchaburi',
                  rating: 4,
                  review: 'Traditional markets on canals. Unique cultural experience.',
                  liked: true
                },
                {
                  name: 'Lumpini Park',
                  location: '192 Wireless Rd, Lumphini, Pathum Wan, Bangkok 10330',
                  rating: 4,
                  review: 'Central park with lake, jogging paths, and monitor lizards.',
                  liked: true
                },
                {
                  name: 'Jim Thompson House',
                  location: '6 Soi Kasem San 2, Rama I Rd, Bangkok 10330',
                  rating: 4,
                  review: 'Traditional Thai house museum. Silk merchant\'s collection.',
                  liked: true
                },
                {
                  name: 'MBK Center',
                  location: '444 Phayathai Rd, Pathum Wan, Bangkok 10330',
                  rating: 4,
                  review: 'Huge shopping mall. Great for electronics and souvenirs.',
                  liked: true
                },
                {
                  name: 'Chao Phraya River Cruise',
                  location: 'Various piers along Chao Phraya',
                  rating: 4,
                  review: 'Scenic boat tour passing temples and local life.',
                  liked: true
                },
                {
                  name: 'Khao San Road',
                  location: 'Khao San Rd, Talat Yot, Phra Nakhon, Bangkok 10200',
                  rating: 3,
                  review: 'Famous backpacker street. Nightlife, street food, and shopping.',
                  liked: true
                }
              ]
            }
          },
          // Singapore - Top 10 hotels
          {
            name: 'Singapore',
            country: 'Singapore',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'Marina Bay Sands',
                  location: '10 Bayfront Ave, Singapore 018956',
                  rating: 5,
                  review: 'Iconic three-tower hotel with the world\'s most famous infinity pool.',
                  liked: true
                },
                {
                  name: 'The Ritz-Carlton Millenia Singapore',
                  location: '7 Raffles Ave, Singapore 039799',
                  rating: 5,
                  review: 'Luxury hotel with stunning Marina Bay views and exceptional service.',
                  liked: true
                },
                {
                  name: 'Mandarin Oriental Singapore',
                  location: '5 Raffles Ave, Singapore 039797',
                  rating: 5,
                  review: 'Riverside luxury hotel with excellent location and world-class amenities.',
                  liked: true
                },
                {
                  name: 'The Fullerton Hotel Singapore',
                  location: '1 Fullerton Square, Singapore 049178',
                  rating: 5,
                  review: 'Historic landmark hotel with elegant colonial architecture.',
                  liked: true
                },
                {
                  name: 'Capella Singapore',
                  location: '1 The Knolls, Sentosa Island, Singapore 098297',
                  rating: 5,
                  review: 'Luxury resort on Sentosa Island with tropical gardens and beach access.',
                  liked: true
                },
                {
                  name: 'Shangri-La Singapore',
                  location: '22 Orange Grove Rd, Singapore 258350',
                  rating: 5,
                  review: 'Luxury hotel with extensive gardens and excellent dining options.',
                  liked: true
                },
                {
                  name: 'The St. Regis Singapore',
                  location: '29 Tanglin Rd, Singapore 247911',
                  rating: 5,
                  review: 'Elegant hotel in Orchard Road with butler service and luxury amenities.',
                  liked: true
                },
                {
                  name: 'Four Seasons Hotel Singapore',
                  location: '190 Orchard Blvd, Singapore 248646',
                  rating: 5,
                  review: 'Modern luxury hotel in Orchard with sophisticated design and excellent service.',
                  liked: true
                },
                {
                  name: 'Raffles Singapore',
                  location: '1 Beach Rd, Singapore 189673',
                  rating: 5,
                  review: 'Historic colonial hotel where the Singapore Sling was invented.',
                  liked: true
                },
                {
                  name: 'Parkroyal Collection Pickering',
                  location: '3 Upper Pickering St, Singapore 058289',
                  rating: 4,
                  review: 'Eco-friendly hotel with stunning sky gardens and modern design.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'Odette',
                  location: '1 St Andrew\'s Rd, #01-04 National Gallery, Singapore 178957',
                  rating: 5,
                  review: 'Three Michelin stars. Modern French cuisine with Asian influences.',
                  liked: true
                },
                {
                  name: 'Les Amis',
                  location: '1 Scotts Rd, #01-16 Shaw Centre, Singapore 228208',
                  rating: 5,
                  review: 'Three Michelin stars. Classic French fine dining.',
                  liked: true
                },
                {
                  name: 'Burnt Ends',
                  location: '20 Teck Lim Rd, Singapore 088391',
                  rating: 4,
                  review: 'Modern Australian barbecue. One Michelin star. Extremely popular.',
                  liked: true
                },
                {
                  name: 'Liao Fan Hawker Chan',
                  location: '78 Smith St, Singapore 058972',
                  rating: 4,
                  review: 'First hawker stall to receive Michelin star. Famous for soy sauce chicken.',
                  liked: true
                },
                {
                  name: 'Candlenut',
                  location: '17A Dempsey Rd, Singapore 249676',
                  rating: 4,
                  review: 'One Michelin star. Modern Peranakan cuisine.',
                  liked: true
                },
                {
                  name: 'Jumbo Seafood',
                  location: '20 Upper Circular Rd, #B1-48 The Riverwalk, Singapore 058416',
                  rating: 4,
                  review: 'Famous for chili crab and black pepper crab. Iconic Singapore dish.',
                  liked: true
                },
                {
                  name: 'Tian Tian Hainanese Chicken Rice',
                  location: '1 Kadayanallur St, #01-10/11 Maxwell Food Centre, Singapore 069184',
                  rating: 4,
                  review: 'Best chicken rice in Singapore. Anthony Bourdain favorite.',
                  liked: true
                },
                {
                  name: 'Waku Ghin',
                  location: '10 Bayfront Ave, L2-01, Singapore 018956',
                  rating: 5,
                  review: 'Two Michelin stars. Japanese fine dining by Tetsuya Wakuda.',
                  liked: true
                },
                {
                  name: 'Corner House',
                  location: '1 Cluny Rd, E J H Corner House, Singapore 259569',
                  rating: 4,
                  review: 'One Michelin star. Modern European cuisine in colonial bungalow.',
                  liked: true
                },
                {
                  name: 'Hill Street Tai Hwa Pork Noodle',
                  location: '466 Crawford Ln, #01-12, Singapore 190466',
                  rating: 4,
                  review: 'One Michelin star. Famous bak chor mee (minced meat noodles).',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'Gardens by the Bay',
                  location: '18 Marina Gardens Dr, Singapore 018953',
                  rating: 5,
                  review: 'Futuristic gardens with Supertrees and Cloud Forest. Light show at night.',
                  liked: true
                },
                {
                  name: 'Marina Bay Sands',
                  location: '10 Bayfront Ave, Singapore 018956',
                  rating: 5,
                  review: 'Iconic hotel with infinity pool. SkyPark offers stunning views.',
                  liked: true
                },
                {
                  name: 'Singapore Zoo',
                  location: '80 Mandai Lake Rd, Singapore 729826',
                  rating: 5,
                  review: 'World\'s best rainforest zoo. Open enclosures and animal shows.',
                  liked: true
                },
                {
                  name: 'Sentosa Island',
                  location: 'Sentosa, Singapore',
                  rating: 4,
                  review: 'Resort island with beaches, theme parks, and attractions.',
                  liked: true
                },
                {
                  name: 'Universal Studios Singapore',
                  location: '8 Sentosa Gateway, Singapore 098269',
                  rating: 5,
                  review: 'Theme park with rides and shows. Great for families.',
                  liked: true
                },
                {
                  name: 'Chinatown',
                  location: 'Chinatown, Singapore',
                  rating: 4,
                  review: 'Historic district with temples, markets, and authentic food.',
                  liked: true
                },
                {
                  name: 'Little India',
                  location: 'Little India, Singapore',
                  rating: 4,
                  review: 'Vibrant neighborhood with Indian culture, food, and shopping.',
                  liked: true
                },
                {
                  name: 'Singapore Flyer',
                  location: '30 Raffles Ave, Singapore 039803',
                  rating: 4,
                  review: 'Giant observation wheel. Panoramic views of the city.',
                  liked: true
                },
                {
                  name: 'Merlion Park',
                  location: '1 Fullerton Rd, Singapore 049213',
                  rating: 4,
                  review: 'Iconic Merlion statue. Symbol of Singapore.',
                  liked: true
                },
                {
                  name: 'Orchard Road',
                  location: 'Orchard Rd, Singapore',
                  rating: 4,
                  review: 'Famous shopping street with malls, restaurants, and entertainment.',
                  liked: true
                }
              ]
            }
          },
          // Dubai, United Arab Emirates - Top 10 hotels
          {
            name: 'Dubai',
            country: 'United Arab Emirates',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'Burj Al Arab',
                  location: 'Jumeirah Beach, Dubai, UAE',
                  rating: 5,
                  review: 'Iconic sail-shaped hotel with stunning views of the Arabian Gulf.',
                  liked: true
                },
                {
                  name: 'Atlantis The Palm',
                  location: 'Crescent Rd, The Palm, Dubai, UAE',
                  rating: 5,
                  review: 'Luxury resort on Palm Jumeirah with underwater suites and waterpark.',
                  liked: true
                },
                {
                  name: 'Armani Hotel Dubai',
                  location: 'Burj Khalifa, Downtown Dubai, Dubai, UAE',
                  rating: 5,
                  review: 'Designer hotel in Burj Khalifa with Giorgio Armani\'s signature style.',
                  liked: true
                },
                {
                  name: 'One&Only The Palm',
                  location: 'West Crescent, Palm Jumeirah, Dubai, UAE',
                  rating: 5,
                  review: 'Exclusive resort on Palm Jumeirah with private beach and luxury villas.',
                  liked: true
                },
                {
                  name: 'Four Seasons Resort Dubai at Jumeirah Beach',
                  location: 'Jumeirah Beach Rd, Dubai, UAE',
                  rating: 5,
                  review: 'Beachfront luxury resort with stunning views and world-class amenities.',
                  liked: true
                },
                {
                  name: 'The Ritz-Carlton Dubai',
                  location: 'Al Mamsha St, Dubai Marina, Dubai, UAE',
                  rating: 5,
                  review: 'Luxury hotel in Dubai Marina with excellent location and service.',
                  liked: true
                },
                {
                  name: 'Jumeirah Al Qasr',
                  location: 'Madinat Jumeirah, Dubai, UAE',
                  rating: 5,
                  review: 'Palace-style resort with traditional architecture and private beach.',
                  liked: true
                },
                {
                  name: 'Mandarin Oriental Jumeirah',
                  location: 'Jumeirah Beach Rd, Dubai, UAE',
                  rating: 5,
                  review: 'Modern luxury hotel with beach access and excellent dining options.',
                  liked: true
                },
                {
                  name: 'The Address Downtown Dubai',
                  location: 'Mohammed Bin Rashid Blvd, Downtown Dubai, Dubai, UAE',
                  rating: 5,
                  review: 'Luxury hotel with stunning views of Burj Khalifa and Dubai Fountain.',
                  liked: true
                },
                {
                  name: 'Palazzo Versace Dubai',
                  location: 'Jaddaf Waterfront, Dubai, UAE',
                  rating: 5,
                  review: 'Designer hotel with Versace interiors and waterfront location.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'Zuma',
                  location: 'Gate Village 06, Al Mustaqbal St, Dubai',
                  rating: 5,
                  review: 'Contemporary Japanese izakaya. Excellent sushi and robata grill.',
                  liked: true
                },
                {
                  name: 'Nobu',
                  location: 'Atlantis The Palm, Crescent Rd, Dubai',
                  rating: 5,
                  review: 'Nobu Matsuhisa\'s signature restaurant. Japanese-Peruvian fusion.',
                  liked: true
                },
                {
                  name: 'Al Hadheerah',
                  location: 'Bab Al Shams Desert Resort, Dubai',
                  rating: 4,
                  review: 'Desert dining experience with traditional Arabic cuisine and entertainment.',
                  liked: true
                },
                {
                  name: 'Pierchic',
                  location: 'Al Qasr Hotel, Madinat Jumeirah, Dubai',
                  rating: 5,
                  review: 'Overwater restaurant with stunning views. Seafood-focused menu.',
                  liked: true
                },
                {
                  name: 'At.mosphere',
                  location: 'Burj Khalifa, 122nd Floor, Dubai',
                  rating: 5,
                  review: 'Fine dining in Burj Khalifa. Highest restaurant in the world.',
                  liked: true
                },
                {
                  name: 'Al Fanar Restaurant',
                  location: 'Dubai Festival City, Dubai',
                  rating: 4,
                  review: 'Authentic Emirati cuisine. Traditional dishes in heritage setting.',
                  liked: true
                },
                {
                  name: 'Ravi Restaurant',
                  location: 'Al Satwa, Dubai',
                  rating: 4,
                  review: 'Legendary Pakistani restaurant. Famous for biryani and curries.',
                  liked: true
                },
                {
                  name: 'Pai Thai',
                  location: 'Al Qasr Hotel, Madinat Jumeirah, Dubai',
                  rating: 4,
                  review: 'Authentic Thai cuisine in beautiful setting. Excellent pad thai.',
                  liked: true
                },
                {
                  name: 'La Petite Maison',
                  location: 'Gate Village 8, DIFC, Dubai',
                  rating: 4,
                  review: 'French-Mediterranean cuisine. Excellent seafood and pasta.',
                  liked: true
                },
                {
                  name: 'Al Ustad Special Kabab',
                  location: 'Al Mankhool Rd, Dubai',
                  rating: 4,
                  review: 'Historic Iranian restaurant since 1978. Best kebabs in Dubai.',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'Burj Khalifa',
                  location: '1 Sheikh Mohammed bin Rashid Blvd, Dubai',
                  rating: 5,
                  review: 'World\'s tallest building. Stunning views from observation decks.',
                  liked: true
                },
                {
                  name: 'Dubai Mall',
                  location: 'Financial Centre Rd, Dubai',
                  rating: 5,
                  review: 'World\'s largest mall. Shopping, aquarium, and entertainment.',
                  liked: true
                },
                {
                  name: 'Palm Jumeirah',
                  location: 'Palm Jumeirah, Dubai',
                  rating: 5,
                  review: 'Man-made palm-shaped island. Luxury resorts and beaches.',
                  liked: true
                },
                {
                  name: 'Dubai Fountain',
                  location: 'Dubai Mall, Dubai',
                  rating: 5,
                  review: 'World\'s largest choreographed fountain. Spectacular water and light show.',
                  liked: true
                },
                {
                  name: 'Desert Safari',
                  location: 'Dubai Desert',
                  rating: 5,
                  review: 'Dune bashing, camel rides, and traditional dinner. Unforgettable experience.',
                  liked: true
                },
                {
                  name: 'Dubai Marina',
                  location: 'Dubai Marina, Dubai',
                  rating: 4,
                  review: 'Modern waterfront district. Yacht tours and dining.',
                  liked: true
                },
                {
                  name: 'Jumeirah Beach',
                  location: 'Jumeirah Beach, Dubai',
                  rating: 4,
                  review: 'Beautiful public beach with views of Burj Al Arab.',
                  liked: true
                },
                {
                  name: 'Dubai Museum',
                  location: 'Al Fahidi Fort, Dubai',
                  rating: 4,
                  review: 'History of Dubai from fishing village to modern city.',
                  liked: true
                },
                {
                  name: 'Gold Souk',
                  location: 'Deira, Dubai',
                  rating: 4,
                  review: 'Traditional market with gold, spices, and textiles.',
                  liked: true
                },
                {
                  name: 'IMG Worlds of Adventure',
                  location: 'Sheikh Mohammed Bin Zayed Rd, Dubai',
                  rating: 4,
                  review: 'World\'s largest indoor theme park. Great for families.',
                  liked: true
                }
              ]
            }
          },
          // Mumbai, India - Top 10 hotels
          {
            name: 'Mumbai',
            country: 'India',
            numberOfDays: 1,
            hotels: {
              create: [
                {
                  name: 'The Taj Mahal Palace',
                  location: 'Apollo Bunder, Mumbai 400001',
                  rating: 5,
                  review: 'Iconic heritage hotel overlooking the Gateway of India.',
                  liked: true
                },
                {
                  name: 'The Oberoi Mumbai',
                  location: 'Nariman Point, Mumbai 400021',
                  rating: 5,
                  review: 'Luxury hotel with stunning sea views and exceptional service.',
                  liked: true
                },
                {
                  name: 'The St. Regis Mumbai',
                  location: '462 Senapati Bapat Marg, Lower Parel, Mumbai 400013',
                  rating: 5,
                  review: 'Modern luxury hotel with butler service and excellent amenities.',
                  liked: true
                },
                {
                  name: 'Four Seasons Hotel Mumbai',
                  location: '114 Dr E Moses Rd, Worli, Mumbai 400018',
                  rating: 5,
                  review: 'Contemporary luxury hotel with excellent dining and spa facilities.',
                  liked: true
                },
                {
                  name: 'The Leela Mumbai',
                  location: 'Sahar, Andheri East, Mumbai 400059',
                  rating: 5,
                  review: 'Luxury hotel near airport with elegant rooms and excellent service.',
                  liked: true
                },
                {
                  name: 'ITC Maratha Mumbai',
                  location: 'Sahar, Andheri East, Mumbai 400099',
                  rating: 5,
                  review: 'Luxury hotel with traditional Indian design and excellent dining.',
                  liked: true
                },
                {
                  name: 'The Taj Lands End',
                  location: 'Bandstand, Bandra West, Mumbai 400050',
                  rating: 5,
                  review: 'Luxury hotel in Bandra with sea views and excellent location.',
                  liked: true
                },
                {
                  name: 'JW Marriott Mumbai Juhu',
                  location: 'Juhu Tara Rd, Juhu, Mumbai 400049',
                  rating: 4,
                  review: 'Beachfront hotel with modern amenities and excellent dining.',
                  liked: true
                },
                {
                  name: 'The Trident Bandra Kurla',
                  location: 'C-56, G Block, Bandra Kurla Complex, Mumbai 400098',
                  rating: 4,
                  review: 'Modern hotel in business district with excellent facilities.',
                  liked: true
                },
                {
                  name: 'Sofitel Mumbai BKC',
                  location: 'C-57, Bandra Kurla Complex, Mumbai 400051',
                  rating: 4,
                  review: 'French luxury hotel with contemporary design and excellent service.',
                  liked: true
                }
              ]
            },
            restaurants: {
              create: [
                {
                  name: 'Bombay Canteen',
                  location: 'Kamala Mills, Lower Parel, Mumbai 400013',
                  rating: 4,
                  review: 'Modern Indian cuisine with creative twists. Great cocktails.',
                  liked: true
                },
                {
                  name: 'Trishna',
                  location: '7 Sai Baba Marg, Kala Ghoda, Mumbai 400001',
                  rating: 4,
                  review: 'Legendary seafood restaurant. Famous for butter garlic crab.',
                  liked: true
                },
                {
                  name: 'Gajalee',
                  location: 'Near Vile Parle Station, Mumbai',
                  rating: 4,
                  review: 'Authentic Malvani coastal cuisine. Excellent fish curry and rice.',
                  liked: true
                },
                {
                  name: 'The Table',
                  location: 'Kalapesi Trust Building, Colaba, Mumbai 400005',
                  rating: 4,
                  review: 'Farm-to-table restaurant. Modern global cuisine with local ingredients.',
                  liked: true
                },
                {
                  name: 'Bademiya',
                  location: 'Tulloch Rd, Apollo Bandar, Mumbai 400001',
                  rating: 4,
                  review: 'Iconic street food. Best kebabs and rolls. Open late night.',
                  liked: true
                },
                {
                  name: 'Masala Library',
                  location: 'First International Financial Centre, Bandra Kurla Complex, Mumbai 400051',
                  rating: 4,
                  review: 'Molecular gastronomy meets Indian cuisine. Creative presentations.',
                  liked: true
                },
                {
                  name: 'Britannia & Co.',
                  location: 'Wakefield House, Ballard Estate, Mumbai 400001',
                  rating: 4,
                  review: 'Historic Parsi restaurant since 1923. Famous berry pulao.',
                  liked: true
                },
                {
                  name: 'Theobroma',
                  location: 'Multiple locations, Mumbai',
                  rating: 4,
                  review: 'Best brownies and baked goods in Mumbai. Must-try desserts.',
                  liked: true
                },
                {
                  name: 'Swati Snacks',
                  location: '248 Karai Estate, Tardeo, Mumbai 400034',
                  rating: 4,
                  review: 'Authentic Gujarati snacks and thali. Vegetarian paradise.',
                  liked: true
                },
                {
                  name: 'Khyber',
                  location: '145 MG Rd, Kala Ghoda, Mumbai 400001',
                  rating: 4,
                  review: 'Historic restaurant serving North Indian and Mughlai cuisine.',
                  liked: true
                }
              ]
            },
            activities: {
              create: [
                {
                  name: 'Gateway of India',
                  location: 'Apollo Bunder, Mumbai 400001',
                  rating: 5,
                  review: 'Iconic arch monument. Starting point for boat trips to Elephanta Caves.',
                  liked: true
                },
                {
                  name: 'Elephanta Caves',
                  location: 'Elephanta Island, Mumbai',
                  rating: 5,
                  review: 'Ancient rock-cut caves with Hindu sculptures. UNESCO World Heritage Site.',
                  liked: true
                },
                {
                  name: 'Marine Drive',
                  location: 'Marine Drive, Mumbai',
                  rating: 4,
                  review: '3.6km promenade along Arabian Sea. Beautiful sunset views.',
                  liked: true
                },
                {
                  name: 'Chhatrapati Shivaji Terminus',
                  location: 'Fort Area, Mumbai 400001',
                  rating: 5,
                  review: 'Historic railway station. Victorian Gothic architecture. UNESCO site.',
                  liked: true
                },
                {
                  name: 'Dharavi Slum Tour',
                  location: 'Dharavi, Mumbai',
                  rating: 4,
                  review: 'Educational tour of Asia\'s largest slum. See local industries and community.',
                  liked: true
                },
                {
                  name: 'Haji Ali Dargah',
                  location: 'Dargah Rd, Haji Ali, Mumbai 400034',
                  rating: 4,
                  review: 'Floating mosque on Arabian Sea. Beautiful architecture and peaceful atmosphere.',
                  liked: true
                },
                {
                  name: 'Colaba Causeway',
                  location: 'Colaba, Mumbai',
                  rating: 4,
                  review: 'Famous shopping street. Great for souvenirs, street food, and people-watching.',
                  liked: true
                },
                {
                  name: 'Sanjay Gandhi National Park',
                  location: 'Borivali East, Mumbai 400066',
                  rating: 4,
                  review: 'Large national park with Kanheri Caves and wildlife. Escape from city.',
                  liked: true
                },
                {
                  name: 'Bollywood Studio Tour',
                  location: 'Film City, Goregaon, Mumbai',
                  rating: 4,
                  review: 'See behind the scenes of Bollywood film production.',
                  liked: true
                },
                {
                  name: 'Crawford Market',
                  location: 'Dockyard Rd, Mumbai 400001',
                  rating: 4,
                  review: 'Historic market with fruits, vegetables, and household items.',
                  liked: true
                }
              ]
            }
          }
        ]
      }
    },
    include: {
      cities_data: {
        include: {
          hotels: true,
          restaurants: true,
          activities: true
        }
      }
    }
  });

  console.log(`✅ Created database trip`);
  console.log(`✅ Added ${databaseTrip.cities_data.length} cities`);
  
  const totalHotels = databaseTrip.cities_data.reduce((sum, city) => sum + city.hotels.length, 0);
  const totalRestaurants = databaseTrip.cities_data.reduce((sum, city) => sum + (city.restaurants?.length || 0), 0);
  const totalActivities = databaseTrip.cities_data.reduce((sum, city) => sum + (city.activities?.length || 0), 0);
  console.log(`✅ Added ${totalHotels} hotels, ${totalRestaurants} restaurants, and ${totalActivities} activities from around the world!`);
  
  console.log('\n📋 Data by city:');
  databaseTrip.cities_data.forEach(city => {
    console.log(`   ${city.name}, ${city.country}: ${city.hotels.length} hotels, ${city.restaurants?.length || 0} restaurants, ${city.activities?.length || 0} activities`);
  });

  console.log('\n✨ Seed completed successfully!');
  console.log('💡 This database is hidden from trips list but available for hotel, restaurant, and activity suggestions.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

