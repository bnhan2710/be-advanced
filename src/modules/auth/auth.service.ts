import { LoginDto, RegisterDto} from "./dto";
import connection from "../../configs/database.connect"
import { User } from "../../orm/entities/User";
import { Role } from "../../orm/entities/Role";
import { generateAccessToken , hashPassword , comparePassword } from '../../utils/auth.util'
import { ConflictRequestError, NotFoundError , AuthFailError, BadRequestError } from '../../errors/error.response'
import { RoleEnum } from "../../common/enums/role";

class AuthService {

    public async login(loginDto: LoginDto):Promise<{accessToken: string} | undefined>{
        const user = await connection.getRepository(User).findOne({where:{username: loginDto.username }})
            if(!user){
                throw new NotFoundError('Username not found!')
            }
            const matchPassword = await comparePassword(loginDto.password,user.password)
            if(!matchPassword){
                throw new AuthFailError('Password is incorrect!')
            }
            const payloadData = {
                id: user.id,
                username: user.username
            }
            return {
                accessToken : await generateAccessToken(payloadData)
            }
    }

    public async register(registerDto: RegisterDto):Promise<void>{
            const ExitsUser = await connection.getRepository(User).findOne({ where: { username: registerDto.username } });
            if(ExitsUser){
                throw new ConflictRequestError('User already exits')
            } 
            const ExitsEmail = await connection.getRepository(User).findOne({ where: { email: registerDto.email } });
            if(ExitsEmail){
                throw new ConflictRequestError('Email already exits')
            }
            registerDto.password = await hashPassword(registerDto.password)
            const role = await connection.getRepository(Role).findOne({where: {name: RoleEnum.USER}})
            if(!role){
                throw new NotFoundError('Role not found')
            }
            await connection.getRepository(User).save({
                username: registerDto.username,
                email: registerDto.email,
                password: registerDto.password,
                roles: [role]
            })
            
       }
}


export default new AuthService