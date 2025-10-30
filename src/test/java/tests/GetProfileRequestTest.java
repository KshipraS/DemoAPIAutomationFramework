package tests;

import org.testng.annotations.Test;

import base.UserProfileManagementService;
import io.restassured.response.Response;
import models.response.LoginResponse;
import models.response.UserProfileResponse;
import util.Utility;

public class GetProfileRequestTest 
{
	@Test(description="Verify Get Profile")
	public void getProfileInfo()
	{
		LoginResponse loginResponse=new Utility().doLogin("Kshipra","Kshipra123");
		System.out.println(loginResponse.getToken());
		
		UserProfileManagementService userProfileManagementService=new UserProfileManagementService();
		Response response=userProfileManagementService.getProfile(loginResponse.getToken());
		System.out.println("Response of getProfile operation----"+response.asPrettyString());
		UserProfileResponse userProfileResponse=response.as(UserProfileResponse.class);
		System.out.println(userProfileResponse.getFirstName());
	}
}
