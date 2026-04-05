/**
 * @file src/modules/listing/__tests__/listing.service.test.ts
 * @description Unit tests for ListingService (CRUD operations)
 */

import { ListingService } from '../listing.service';
import { prisma } from '../../../config/prisma.config';
import { AppError } from '../../../middlewares/error.middleware';

// Mock Prisma
jest.mock('../../../config/prisma.config', () => ({
  prisma: {
    listing: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock Cloudinary
jest.mock('../../../config/cloudinary.config', () => ({
  uploader: {
    upload_stream: jest.fn(),
  },
}));

describe('ListingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================================
  // CREATE LISTING TESTS
  // =====================================================================

  describe('createListing', () => {

    it('should successfully create a listing without photos', async () => {
      const mockListing = {
        id: 'listing-123',
        title: 'Cozy Studio in Paris',
        description: 'Beautiful apartment near Eiffel Tower',
        city: 'Paris',
        price: 500,
        type: 'STUDIO',
        ownerId: 'user-123',
        status: 'PENDING',
        photos: [],
        createdAt: new Date(),
      };

      (prisma.listing.create as jest.Mock).mockResolvedValueOnce(mockListing);

      const result = await ListingService.createListing(
        {
          title: 'Cozy Studio in Paris',
          description: 'Beautiful apartment near Eiffel Tower',
          address: '123 Rue de la Tour, Paris',
          city: 'Paris',
          price: 500,
          latitude: 48.8566,
          longitude: 2.3522,
          type: 'STUDIO',
        },
        'user-123',
        []
      );

      expect(result.title).toBe('Cozy Studio in Paris');
      expect(result.price).toBe(500);
      expect(result.ownerId).toBe('user-123');
      expect(result.status).toBe('PENDING');
    });

    it('should create listing with owner correctly set', async () => {
      const mockListing = {
        id: 'listing-456',
        title: 'Apartment',
        ownerId: 'owner-789',
      };

      (prisma.listing.create as jest.Mock).mockResolvedValueOnce(mockListing);

      const result = await ListingService.createListing(
        { title: 'Apartment', description: 'Nice apartment', address: '456 Baker St', city: 'London', price: 800, latitude: 51.5074, longitude: -0.1278, type: 'APPARTEMENT' },
        'owner-789',
        []
      );

      expect(result.ownerId).toBe('owner-789');
      expect(prisma.listing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: 'owner-789',
          }),
        })
      );
    });
  });

  // =====================================================================
  // GET ALL LISTINGS TESTS
  // =====================================================================

  describe('getAllListings', () => {

    it('should return listings with pagination (default: page 1, limit 20)', async () => {
      const mockListings = [
        { id: '1', title: 'Listing 1', status: 'ACTIVE' },
        { id: '2', title: 'Listing 2', status: 'ACTIVE' },
      ];

      (prisma.listing.findMany as jest.Mock).mockResolvedValueOnce(mockListings);
      (prisma.listing.count as jest.Mock).mockResolvedValueOnce(50);

      const result = await ListingService.getAllListings();

      expect(result.listings).toHaveLength(2);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(3); // ceil(50/20)
    });

    it('should only return ACTIVE listings', async () => {
      (prisma.listing.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.listing.count as jest.Mock).mockResolvedValueOnce(0);

      await ListingService.getAllListings();

      expect(prisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        })
      );
    });

    it('should calculate pagination correctly for multiple pages', async () => {
      (prisma.listing.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.listing.count as jest.Mock).mockResolvedValueOnce(100);

      const result = await ListingService.getAllListings(3, 25);

      // Page 3 with limit 25: skip = (3-1)*25 = 50
      expect(prisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
          take: 25,
        })
      );
      expect(result.pagination.totalPages).toBe(4);
    });
  });

  // =====================================================================
  // GET LISTING BY ID TESTS
  // =====================================================================

  describe('getListingById', () => {

    it('should return listing with owner and reviews', async () => {
      const mockListing = {
        id: 'listing-123',
        title: 'Test Listing',
        ownerId: 'user-123',
        owner: { id: 'user-123', name: 'Owner Name' },
        reviews: [],
        status: 'ACTIVE',
      };

      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(mockListing);

      const result = await ListingService.getListingById('listing-123');

      expect(result.title).toBe('Test Listing');
      expect(result.owner.name).toBe('Owner Name');
    });

    it('should throw 404 error when listing not found', async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        ListingService.getListingById('nonexistent-id')
      ).rejects.toThrow('Logement introuvable.');
    });

    it('should throw 404 error with correct status code', async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(null);

      try {
        await ListingService.getListingById('nonexistent-id');
      } catch (err) {
        if (err instanceof AppError) {
          expect(err.statusCode).toBe(404);
        }
      }
    });
  });

  // =====================================================================
  // UPDATE LISTING TESTS
  // =====================================================================

  describe('updateListing', () => {

    it('should allow owner to update their own listing', async () => {
      const mockListing = {
        id: 'listing-123',
        ownerId: 'user-123',
        title: 'Original Title',
      };

      const updatedListing = {
        id: 'listing-123',
        ownerId: 'user-123',
        title: 'Updated Title',
      };

      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(mockListing);
      (prisma.listing.update as jest.Mock).mockResolvedValueOnce(updatedListing);

      const result = await ListingService.updateListing(
        'listing-123',
        'user-123', // Same as ownerId
        'STUDENT',
        { title: 'Updated Title' }
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should reject non-owner with 403 error', async () => {
      const mockListing = {
        id: 'listing-123',
        ownerId: 'owner-123',
      };

      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(mockListing);

      await expect(
        ListingService.updateListing(
          'listing-123',
          'different-user', // Different from ownerId
          'STUDENT',
          { title: 'Hacked!' }
        )
      ).rejects.toThrow('Vous n\'êtes pas autorisé');
    });

    it('should allow ADMIN to update any listing', async () => {
      const mockListing = {
        id: 'listing-123',
        ownerId: 'different-owner',
      };

      const updatedListing = {
        id: 'listing-123',
        title: 'Admin Updated',
      };

      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(mockListing);
      (prisma.listing.update as jest.Mock).mockResolvedValueOnce(updatedListing);

      const result = await ListingService.updateListing(
        'listing-123',
        'admin-user',
        'ADMIN', // Admin role
        { title: 'Admin Updated' }
      );

      expect(result.title).toBe('Admin Updated');
      expect(prisma.listing.update).toHaveBeenCalled();
    });
  });

  // =====================================================================
  // DELETE LISTING TESTS
  // =====================================================================

  describe('deleteListing', () => {

    it('should allow owner to delete their own listing', async () => {
      const mockListing = {
        id: 'listing-123',
        ownerId: 'user-123',
      };

      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(mockListing);
      (prisma.listing.delete as jest.Mock).mockResolvedValueOnce(mockListing);

      const result = await ListingService.deleteListing(
        'listing-123',
        'user-123',
        'STUDENT'
      );

      expect(prisma.listing.delete).toHaveBeenCalledWith({
        where: { id: 'listing-123' },
      });
    });

    it('should reject non-owner with 403 error', async () => {
      const mockListing = {
        id: 'listing-123',
        ownerId: 'owner-123',
      };

      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(mockListing);

      await expect(
        ListingService.deleteListing(
          'listing-123',
          'different-user',
          'STUDENT'
        )
      ).rejects.toThrow('Vous n\'êtes pas autorisé');
    });

    it('should allow ADMIN to delete any listing', async () => {
      const mockListing = {
        id: 'listing-123',
        ownerId: 'different-owner',
      };

      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(mockListing);
      (prisma.listing.delete as jest.Mock).mockResolvedValueOnce(mockListing);

      await ListingService.deleteListing(
        'listing-123',
        'admin-user',
        'ADMIN'
      );

      expect(prisma.listing.delete).toHaveBeenCalled();
    });

    it('should throw 404 when listing not found', async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        ListingService.deleteListing('nonexistent', 'user-123', 'STUDENT')
      ).rejects.toThrow('Logement introuvable.');
    });
  });
});
