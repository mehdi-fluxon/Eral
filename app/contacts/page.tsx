import ContactList from '../components/ContactList'

export default function ContactsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Contacts
        </h1>
        <p className="text-gray-600">
          Manage your contact relationships and communication history.
        </p>
      </div>

      <ContactList />
    </div>
  )
}