

const Form = () => {
    return (
        <form className="form">
            <h2>Sign Up</h2>
            <input type="text" placeholder="First Name" />
            <input type="text" placeholder="Last Name" />
            <input className="birthdate" type="date" placeholder="Date of Birth" />
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button>Submit</button>
        </form>
    );
};

export default Form;