package models.request;

public class UserProfileRequest 
{
	private String email;
	private String firstName;
	private String lastName;
	private String mobileNumber;
	
	private UserProfileRequest(String email, String firstName, String lastName, String mobileNumber) {
		super();
		this.email = email;
		this.firstName = firstName;
		this.lastName = lastName;
		this.mobileNumber = mobileNumber;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getFirstName() {
		return firstName;
	}
	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}
	public String getLastName() {
		return lastName;
	}
	public void setLastName(String lastName) {
		this.lastName = lastName;
	}
	public String getMobileNumber() {
		return mobileNumber;
	}
	public void setMobileNumber(String mobileNumber) {
		this.mobileNumber = mobileNumber;
	}
	@Override
	public String toString() {
		return "UserProfileRequest [email=" + email + ", firstName=" + firstName + ", lastName=" + lastName
				+ ", mobileNumber=" + mobileNumber + "]";
	}
	
	public static class Builder
	{
		private String email;
		private String firstName;
		private String lastName;
		private String mobileNumber;
		
		public Builder email(String email)
		{
			this.email=email;
			return this;
		}
		public Builder firstName(String firstName)
		{
			this.firstName=firstName;
			return this;
		}
		public Builder lastName(String lastName)
		{
			this.lastName=lastName;
			return this;
		}
		public Builder mobileNumber(String mobileNumber)
		{
			this.mobileNumber=mobileNumber;
			return this;
		}
		
		public UserProfileRequest build()
		{
			UserProfileRequest userProfileRequest=new UserProfileRequest(email, firstName, lastName, mobileNumber);
			return userProfileRequest;
			
		}
	}
	
}
