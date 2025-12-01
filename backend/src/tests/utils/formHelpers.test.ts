import { extractPhotosFromFormData, extractPathFromUrl } from '../../utils/formHelpers';

describe('FormHelpers', () => {
  describe('extractPhotosFromFormData', () => {
    it('should extract photos from nested object', () => {
      const data = {
        section1: {
          photos: [
            { url: 'http://example.com/photo1.jpg', name: 'photo1.jpg' },
          ],
        },
        section2: {
          photo: { url: 'http://example.com/photo2.jpg', name: 'photo2.jpg' },
        },
      };

      const result = extractPhotosFromFormData(data);
      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('http://example.com/photo1.jpg');
    });

    it('should handle empty data', () => {
      expect(extractPhotosFromFormData(null)).toEqual([]);
      expect(extractPhotosFromFormData({})).toEqual([]);
    });
  });

  describe('extractPathFromUrl', () => {
    it('should extract path from firebase url', () => {
      const url = 'https://firebasestorage.googleapis.com/v0/b/app.appspot.com/o/uploads%2Fphoto.jpg?alt=media';
      expect(extractPathFromUrl(url)).toBe('uploads/photo.jpg');
    });

    it('should return original url if no match', () => {
      const url = 'http://example.com/photo.jpg';
      expect(extractPathFromUrl(url)).toBe(url);
    });
  });
});
