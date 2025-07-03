import PageTitle from '../components/PageTitle.tsx';
import Login from '../components/Login.tsx';
import NavBar from '../components/NavBar.tsx';
const LoginPage = () =>
{
    return(
    <div>
    <Login />
    <PageTitle />
    <NavBar/>
    </div>
    );
};
export default LoginPage;