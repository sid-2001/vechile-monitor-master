// import { Navigate } from "react-router-dom";

import { Navigate, useNavigate } from 'react-router-dom'
import { LocalStorageService } from '../helpers/local-storage-service'

export type ProtectedRouteProps = {
  authenticationPath: string
  outlet: JSX.Element
}


function ProtectedRoute({
  //@ts-ignore
  authenticationPath,
  outlet,
}: ProtectedRouteProps) {
  const localstorageService = new LocalStorageService()
  const isAuthenticated = localstorageService.get_accesstoken()
  const navigate=useNavigate()

  if (isAuthenticated) {


 
    return outlet
  
  } else {
    return <Navigate to={{ pathname: authenticationPath }} />
    // return outlet
  }
}

export default ProtectedRoute
