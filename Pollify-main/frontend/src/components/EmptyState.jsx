const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
    {Icon && (
      <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
        <Icon className="text-3xl text-primary-500" />
      </div>
    )}
    <h3 className="font-display font-semibold text-lg text-gray-800 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
