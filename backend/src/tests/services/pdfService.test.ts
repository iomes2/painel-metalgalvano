import { PdfService } from '../../services/pdfService';

// Mock pdfmake
jest.mock('pdfmake', () => {
  return jest.fn().mockImplementation(() => ({
    createPdfKitDocument: jest.fn().mockReturnValue({
      on: jest.fn((event, callback) => {
        if (event === 'end') callback();
        if (event === 'data') callback(Buffer.from('pdf-chunk'));
        return {};
      }),
      end: jest.fn(),
    }),
  }));
});

describe('PdfService', () => {
  let pdfService: PdfService;

  beforeEach(() => {
    // Re-instantiate service to use the mock
    jest.isolateModules(() => {
      const { PdfService } = require('../../services/pdfService');
      pdfService = new PdfService();
    });
  });

  describe('generateReportPdf', () => {
    it('should generate a PDF buffer', async () => {
      // Need to get the service instance that uses the mock
      // Since PdfService exports a singleton 'new PdfService()', we might need to rely on that.
      // But we mocked pdfmake, so the singleton should have picked it up if the mock was hoisted.
      
      // Let's re-import to be sure
      const { PdfService: PdfServiceClass } = require('../../services/pdfService');
      const service = new PdfServiceClass();

      const mockReportData = {
        id: 'report-1',
        formType: 'checklist',
        formName: 'Checklist Diário',
        formData: { field1: 'value1' },
        submittedAt: new Date(),
        submittedBy: 'user-1',
      };

      const mockFormDefinition = {
        id: 'def-1',
        name: 'Checklist Diário',
        description: 'Checklist de rotina',
        fields: [
          { id: 'field1', label: 'Campo 1', type: 'text' as const },
        ],
      };

      const mockOsData = {
        osNumber: '12345',
      };

      const result = await service.generateReportPdf(mockReportData, mockFormDefinition, mockOsData);

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
