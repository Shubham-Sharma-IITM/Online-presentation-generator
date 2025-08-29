import PptxGenJS from 'pptxgenjs';
import { PresentationStructure, TemplateStyle } from '../types';
import path from 'path';

export class PresentationService {
  generatePresentation(
    structure: PresentationStructure,
    templateStyle: TemplateStyle,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const pptx = new PptxGenJS();

        // Configure presentation with template style
        pptx.defineLayout({ name: 'CUSTOM', width: 10, height: 5.625 });
        pptx.layout = 'CUSTOM';

        // Create title slide
        const titleSlide = pptx.addSlide();
        titleSlide.addText(structure.title, {
          x: 1,
          y: 2,
          w: 8,
          h: 1.5,
          fontSize: 32,
          fontFace: templateStyle.fonts.title,
          color: templateStyle.colors.primary,
          align: 'center',
          bold: true
        });

        // Create content slides
        structure.slides.forEach((slide, index) => {
          const contentSlide = pptx.addSlide();

          // Add slide title
          contentSlide.addText(slide.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 24,
            fontFace: templateStyle.fonts.title,
            color: templateStyle.colors.primary,
            bold: true
          });

          // Add content bullets
          if (slide.content && slide.content.length > 0) {
            const bulletText = slide.content.map(item => ({ text: item, options: { bullet: true } }));
            
            contentSlide.addText(bulletText, {
              x: 0.5,
              y: 1.5,
              w: 9,
              h: 3.5,
              fontSize: 18,
              fontFace: templateStyle.fonts.body,
              color: templateStyle.colors.text,
              valign: 'top'
            });
          }

          // Add speaker notes if available
          if (slide.speakerNotes) {
            contentSlide.addNotes(slide.speakerNotes);
          }
        });

        // Save presentation
        pptx.writeFile({ fileName: outputPath })
          .then(() => {
            console.log(`Presentation saved to: ${outputPath}`);
            resolve();
          })
          .catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }
}