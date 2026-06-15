import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { navigationStore, dataStore } from '@/store';
import { MainLayout, LoginModal, ConfirmModal, Toast } from '@/components';
import { HomePage, BooksPage, ChatPage, RequestsPage, MembersPage, AdminPage } from '@/pages';

const PageRouter = observer(() => {
  const { currentPage } = navigationStore;

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'books':
      return <BooksPage />;
    case 'chat':
      return <ChatPage />;
    case 'requests':
      return <RequestsPage />;
    case 'members':
      return <MembersPage />;
    case 'admin':
    case 'admin-genres':
    case 'admin-members':
      return <AdminPage />;
    default:
      return <HomePage />;
  }
});

const App = observer(() => {
  useEffect(() => {
    dataStore.loadAllData();
  }, []);

  return (
    <>
      <MainLayout>
        <PageRouter />
      </MainLayout>

      <LoginModal />
      <ConfirmModal />
      <Toast />
    </>
  );
});

export default App;
