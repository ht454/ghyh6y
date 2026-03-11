

class AuthService {
  
  getRandomAvatar(): string {
    const avatars = [
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346816765-lyg2xtd3xj.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346819012-8f4hfxog99m.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346821157-xdv69ctdvu.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346823722-pyvtfk9hzi.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346824830-b3q9imgdj3.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346826084-0xwbjcpkesd.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346827215-hfp5d5ddq7f.png',
      'https://frqraisrycdljwzyxsih.supabase.co/storage/v1/object/public/images/uploads/images/1751346829971-o5z88n3hfc9.png'
    ];
    
    
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex];
  }
}

export const authService = new AuthService();