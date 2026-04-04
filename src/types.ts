export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  createdAt: any;
  followersCount?: number;
  followingCount?: number;
  role?: 'admin' | 'user';
  displayNameChanged?: boolean;
  isProfessionalSeller?: boolean;
  completedTransactions?: number;
  rating?: number;
  totalReviews?: number;
}

export interface Listing {
  id: string;
  title: string;
  englishName?: string;
  description: string;
  price: number;
  imageUrl: string;
  imageUrls?: string[];
  category: string;
  condition: string;
  conditionDetails?: string[];
  set: string;
  cardNumber: string;
  sellerId: string;
  sellerName: string;
  sellerPhoto: string;
  sellerRating?: number;
  sellerCompletedTransactions?: number;
  sellerIsProfessionalSeller?: boolean;
  createdAt: any;
  status: 'active' | 'sold' | 'pending' | 'reserved';
  views?: number;
  likes?: number;
  negotiation?: string | boolean;
  cardType?: string;
  rarity?: string;
  attribute?: string;
  language?: string;
  year?: string;
}

export interface WantListing {
  id: string;
  title: string;
  englishName?: string;
  description: string;
  budget: number;
  targetPrice?: number;
  imageUrl?: string;
  imageUrls?: string[];
  category: string;
  condition?: string;
  set?: string;
  cardNumber?: string;
  userId: string;
  userName: string;
  userPhoto: string;
  userRating?: number;
  userTotalReviews?: number;
  createdAt: any;
  status: 'active' | 'found' | 'pending';
  negotiation?: string | boolean;
  cardType?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  participantIds?: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  listingId?: string;
  listingTitle?: string;
  listingImage?: string;
  listingImageUrl?: string;
  createdAt?: any;
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
  targetUserId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  buyerId?: string;
  buyerName?: string;
  buyerPhoto?: string;
  rating: number;
  text: string;
  comment?: string;
  listingTitle?: string;
  createdAt: any;
}

export interface Comment {
  id: string;
  listingId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  userName?: string;
  userPhoto?: string;
  text: string;
  rating?: number;
  createdAt: any;
}

export interface PortfolioItem {
  id: string;
  title: string;
  set: string;
  cardNumber: string;
  purchasePrice: number;
  currentValue?: number;
  acquiredAt: any;
  imageUrl: string;
  condition?: string;
  quantity?: number;
}

export interface Portfolio {
  id: string;
  userId: string;
  items: PortfolioItem[];
  totalValue: number;
  totalCost: number;
  updatedAt: any;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
  authorName: string;
  authorPhoto: string;
  publishedAt: any;
  readTime: string;
}
