export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  createdAt: any;
  rating: number; // 0-5
  totalReviews: number;
  completedTransactions: number;
  isProfessionalSeller?: boolean;
  followersCount?: number;
  role?: 'admin' | 'user';
  displayNameChanged?: boolean;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: 'Mint' | 'Near Mint' | 'Excellent' | 'Good' | 'Lightly Played' | 'Played' | 'Poor';
  cardType?: 'RAW' | 'PSA 10' | 'PSA 9' | 'PSA 8' | 'BGS' | 'CGC';
  conditionDetails?: string[]; // 美品, 有白邊, 有白點, 有卡傷
  negotiation?: 'Firm' | 'Negotiable';
  attribute?: '水' | '火' | '草' | '電' | '超' | '鬥' | '惡' | '鋼' | '妖' | '龍' | '無';
  rarity?: 'UR' | 'SAR' | 'SR' | 'SSR' | 'HR' | 'AR' | 'C' | 'U' | 'R';
  imageUrl: string;
  imageUrls?: string[];
  sellerId: string;
  sellerName: string;
  sellerPhoto: string;
  sellerRating?: number;
  sellerTotalReviews?: number;
  sellerCompletedTransactions?: number;
  sellerIsProfessionalSeller?: boolean;
  sellerCreatedAt?: any;
  status: 'active' | 'reserved' | 'sold';
  createdAt: any;
  year?: string;
  set?: string;
  cardNumber?: string;
  language?: '日文' | '英文' | '中文';
}

export interface Chat {
  id: string;
  participantIds: string[];
  listingId: string;
  listingTitle: string;
  listingImageUrl: string;
  lastMessage?: string;
  lastMessageAt?: any;
  createdAt: any;
}
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Review {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  buyerPhoto: string;
  listingId: string;
  listingTitle: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface WantListing {
  id: string;
  title: string;
  targetPrice: number;
  imageUrl?: string;
  imageUrls?: string[];
  condition?: 'Mint' | 'Near Mint' | 'Excellent' | 'Good' | 'Lightly Played' | 'Played' | 'Poor';
  cardType?: 'RAW' | 'PSA 10' | 'PSA 9' | 'PSA 8' | 'BGS' | 'CGC';
  conditionDetails?: string[];
  negotiation?: 'Firm' | 'Negotiable';
  buyerId: string;
  buyerName: string;
  buyerPhoto: string;
  buyerRating?: number;
  buyerTotalReviews?: number;
  createdAt: any;
  year?: string;
  set?: string;
  cardNumber?: string;
  language?: '日文' | '英文' | '中文';
}

export interface PortfolioItem {
  id: string;
  listingId: string;
  title: string;
  imageUrl: string;
  purchasePrice: number;
  acquiredAt: any;
}

export interface Portfolio {
  userId: string;
  items: PortfolioItem[];
}
