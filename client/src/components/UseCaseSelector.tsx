import React from 'react';
import { UseCaseTemplate } from '../types';

interface UseCaseSelectorProps {
  templates: UseCaseTemplate[];
  selectedTemplate: string;
  onTemplateSelect: (id: string) => void;
}

export const UseCaseSelector: React.FC<UseCaseSelectorProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Choose a Presentation Type (Optional)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(selectedTemplate === template.id ? '' : template.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <h3 className={`font-medium text-sm ${
              selectedTemplate === template.id ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {template.name}
            </h3>
            <p className={`text-xs mt-1 ${
              selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-500'
            }`}>
              {template.description}
            </p>
          </button>
        ))}
      </div>
      {selectedTemplate && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Applied guidance:</strong> {templates.find(t => t.id === selectedTemplate)?.guidance}
          </p>
        </div>
      )}
    </div>
  );
};