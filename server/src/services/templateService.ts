import StreamZip from 'node-stream-zip';
import path from 'path';
import fs from 'fs-extra';
import { parseStringPromise } from 'xml2js';
import { TemplateStyle } from '../types';

export class TemplateService {
  async extractTemplateStyle(templatePath: string): Promise<TemplateStyle> {
    const zip = new StreamZip.async({ file: templatePath });
    
    try {
      const colors = await this.extractDetailedColors(zip);
      const fonts = await this.extractDetailedFonts(zip);
      const masterSlides = await this.extractMasterSlides(zip);
      const layouts = await this.extractLayouts(zip);
      const images = await this.extractImages(zip, templatePath);

      return {
        colors,
        fonts,
        layouts,
        images,
        masterSlides
      };
    } finally {
      await zip.close();
    }
  }

  private async extractDetailedColors(zip: StreamZip.AsyncZipFile): Promise<any> {
    try {
      const themeData = await zip.entryData('ppt/theme/theme1.xml');
      const themeXml = themeData.toString('utf8');
      const parsedTheme = await parseStringPromise(themeXml);
      
      const colors = {
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

      // Extract color scheme
      const colorScheme = parsedTheme?.['a:theme']?.['a:themeElements']?.[0]?.['a:clrScheme']?.[0];
      
      if (colorScheme) {
        // Extract theme colors
        const extractColor = (colorType: string): string => {
          const colorElement = colorScheme[`a:${colorType}`]?.[0];
          if (colorElement?.['a:srgbClr']?.[0]?.$?.val) {
            return '#' + colorElement['a:srgbClr'][0].$.val;
          }
          return colors.primary; // fallback
        };

        colors.primary = extractColor('dk1') || extractColor('accent1');
        colors.secondary = extractColor('accent2');
        colors.accent1 = extractColor('accent1');
        colors.accent2 = extractColor('accent2');
        colors.accent3 = extractColor('accent3');
        colors.accent4 = extractColor('accent4');
        colors.accent5 = extractColor('accent5');
        colors.accent6 = extractColor('accent6');
        colors.background = extractColor('lt1');
        colors.text = extractColor('dk1');
      }

      return colors;
    } catch (error) {
      console.warn('Could not extract detailed colors from template, using defaults');
      return {
        primary: '#1f4e79',
        secondary: '#70ad47',
        accent1: '#4472c4',
        background: '#ffffff',
        text: '#000000'
      };
    }
  }

  private async extractDetailedFonts(zip: StreamZip.AsyncZipFile): Promise<any> {
    try {
      const themeData = await zip.entryData('ppt/theme/theme1.xml');
      const themeXml = themeData.toString('utf8');
      const parsedTheme = await parseStringPromise(themeXml);
      
      const fonts = {
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
        
        if (majorFont) {
          fonts.title = majorFont;
          fonts.heading = majorFont;
        }
        if (minorFont) {
          fonts.body = minorFont;
        }
      }

      return fonts;
    } catch (error) {
      console.warn('Could not extract detailed fonts from template, using defaults');
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

  private async extractMasterSlides(zip: StreamZip.AsyncZipFile): Promise<any[]> {
    const masterSlides: any[] = [];
    
    try {
      const entries = await zip.entries();
      
      for (const entryName of Object.keys(entries)) {
        if (entryName.startsWith('ppt/slideMasters/slideMaster') && entryName.endsWith('.xml')) {
          try {
            const masterData = await zip.entryData(entryName);
            const masterXml = masterData.toString('utf8');
            const parsedMaster = await parseStringPromise(masterXml);
            
            masterSlides.push({
              name: entryName,
              content: parsedMaster
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

  private async extractLayouts(zip: StreamZip.AsyncZipFile): Promise<any[]> {
    const layouts: any[] = [];
    
    try {
      const entries = await zip.entries();
      
      for (const entryName of Object.keys(entries)) {
        if (entryName.startsWith('ppt/slideLayouts/slideLayout') && entryName.endsWith('.xml')) {
          try {
            const layoutData = await zip.entryData(entryName);
            const layoutXml = layoutData.toString('utf8');
            const parsedLayout = await parseStringPromise(layoutXml);
            
            layouts.push({
              name: entryName,
              content: parsedLayout
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

  private async extractImages(zip: StreamZip.AsyncZipFile, templatePath: string): Promise<string[]> {
    const images: string[] = [];
    
    try {
      const entries = await zip.entries();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg'];
      
      for (const [entryName, entry] of Object.entries(entries)) {
        if (imageExtensions.some(ext => entryName.toLowerCase().endsWith(ext))) {
          images.push(entryName);
        }
      }
    } catch (error) {
      console.warn('Could not extract images from template');
    }

    return images;
  }
}