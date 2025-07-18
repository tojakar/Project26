import Map from '../components/Map.tsx';
import NavBar from '../components/NavBar.tsx';
import PageTitle from '../components/PageTitle.tsx'
import StarRating from '../components/StarRating';


const MapPage = () =>
{
    return(
    <div>
    <PageTitle />
    <NavBar />
    <Map />
    </div>
    );
};
export default MapPage;
