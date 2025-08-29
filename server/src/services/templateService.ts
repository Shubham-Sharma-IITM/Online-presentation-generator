import StreamZip from 'node-stream-zip';
import path from 'path';
import fs from 'fs-extra';
import { parseStringPromise } from 'xml2js';
import { TemplateStyle } from '../types';

export class TemplateService {
  async extractTemplateStyle(templatePath: string): Promise<TemplateStyle> {
    let zip: any;
    
    try {
      zip = new StreamZip.async({ file: templatePath });
      
      const colors = await this.extractColors(zip);
      const fonts = await this.extractFonts(zip);
      const layouts = await this.extractLayouts(zip);
      const images = await this.extractImages(zip);
      const masterSlides = await this.extractMasterSlides(zip);

      return {
        colors,
        fonts,
        layouts,
        images,
        masterSlides
      };
    } catch (error) {
      console.warn('Error extracting template style:', error);
      return this.getDefaultTemplateStyle();
    } finally {
      if (zip) {
        try {
          await zip.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }

  private async extractColors(zip: any): Promise<any> {
    try {
      const themeData = await zip.entryData('ppt/theme/theme1.xml');
      const themeXml = themeData.toString('utf8');
      const parsedTheme = await parseStringPromise(themeXml);
      
      const defaultColors = {
        primary: '#1f4e79',
        secondary: '#70ad47',
        accent1: '#4472c4',
        accent2: '#e7e6e6',
        accent3: '#a5a5a5',
        accent4: '#ffc000',
        accent5: '#5b9bd5',
        accent6: '#70ad47',
        background: '#ffffff',
        text: '#000000',
        scheme: 'default'
      };

      // Try to extract colors, fallback to defaults
      const colorScheme = parsedTheme?.['a:theme']?.['a:themeElements']?.[0]?.['a:clrScheme']?.[0];
      
      if (colorScheme) {
        const extractColor = (colorType: string): string => {
          try {
            const colorElement = colorScheme[`a:${colorType}`]?.[0];
            if (colorElement?.['a:srgbClr']?.[0]?.$?.val) {
              return '#' + colorElement['a:srgbClr'][0].$.val;
            }
          } catch (e) {
            // Ignore extraction errors
          }
          return defaultColors.primary;
        };

        return {
          ...defaultColors,
          primary: extractColor('dk1') || extractColor('accent1'),
          secondary: extractColor('accent2'),
          accent1: extractColor('accent1'),
          accent2: extractColor('accent2'),
          background: extractColor('lt1'),
          text: extractColor('dk1')
        };
      }

      return defaultColors;
    } catch (error) {
      console.warn('Could not extract colors, using defaults');
      return {
        primary: '#1f4e79',
        secondary: '#70ad47',
        accent1: '#4472c4',
        background: '#ffffff',
        text: '#000000'
      };
    }
  }

  private async extractFonts(zip: any): Promise<any> {
    try {
      const themeData = await zip.entryData('ppt/theme/theme1.xml');
      const themeXml = themeData.toString('utf8');
      const parsedTheme = await parseStringPromise(themeXml);
      
      const defaultFonts = {
        title: 'Calibri',
        body: 'Calibri',
        heading: 'Calibri',
        titleSize: 44,
        bodySize: 18,
        headingSize: 24
      };

      const fontScheme = parsedTheme?.['a:theme']?.['a:themeElements']?.[0]?.['a:fontScheme']?.[0];
      
      if (fontScheme) {
        const majorFont = fontScheme['a:majorFont']?.[0]?.['a:latin']?.[0]?.$?.typeface;
        const minorFont = fontScheme['a:minorFont']?.[0]?.['a:latin']?.[0]?.$?.typeface;
        
        return {
          ...defaultFonts,
          title: majorFont || defaultFonts.title,
          heading: majorFont || defaultFonts.heading,
          body: minorFont || defaultFonts.body
        };
      }

      return defaultFonts;
    } catch (error) {
      console.warn('Could not extract fonts, using defaults');
      return {
        title: 'Calibri',
        body: 'Calibri',
        heading: 'Calibri',
        titleSize: 44,
        bodySize: 18,
        headingSize: 24
      };
    }
  }

  private async extractMasterSlides(zip: any): Promise<any[]> {
    const masterSlides: any[] = [];
    
    try {
      const entries = await zip.entries();
      
      for (const entryName of Object.keys(entries)) {
        if (entryName.startsWith('ppt/slideMasters/slideMaster') && entryName.endsWith('.xml')) {
          try {
            const masterData = await zip.entryData(entryName);
            const masterXml = masterData.toString('utf8');
            masterSlides.push({
              name: entryName,
              content: masterXml
            });
          } catch (err) {
            console.warn(`Could not parse master slide ${entryName}`);
          }
        }
      }
    } catch (error) {
      console.warn('Could not extract master slides');
    }

    return masterSlides;
  }

  private async extractLayouts(zip: any): Promise<any[]> {
    const layouts: any[] = [];
    
    try {
      const entries = await zip.entries();
      
      for (const entryName of Object.keys(entries)) {
        if (entryName.startsWith('ppt/slideLayouts/slideLayout') && entryName.endsWith('.xml')) {
          try {
            const layoutData = await zip.entryData(entryName);
            layouts.push({
              name: entryName,
              content: layoutData.toString('utf8')
            });
          } catch (err) {
            console.warn(`Could not parse layout ${entryName}`);
          }
        }
      }
    } catch (error) {
      console.warn('Could not extract layouts');
    }

    return layouts;
  }

  private async extractImages(zip: any): Promise<string[]> {
    const images: string[] = [];
    
    try {
      const entries = await zip.entries();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg'];
      
      for (const entryName of Object.keys(entries)) {
        if (imageExtensions.some(ext => entryName.toLowerCase().endsWith(ext))) {
          images.push(entryName);
        }
      }
    } catch (error) {
      console.warn('Could not extract images from template');
    }

    return images;
  }

  private getDefaultTemplateStyle(): TemplateStyle {
    return {
      colors: {
        primary: '#1f4e79',
        secondary: '#70ad47',
        accent1: '#4472c4',
        background: '#ffffff',
        text: '#000000'
      },
      fonts: {
        title: 'Calibri',
        body: 'Calibri',
        heading: 'Calibri',
        titleSize: 44,
        bodySize: 18,
        headingSize: 24
      },
      layouts: [],
      images: [],
      masterSlides: []
    };
  }
}