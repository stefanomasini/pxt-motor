/*！
 * @file pxt-motor/main.ts
 * @brief DFRobot's microbit motor drive makecode library.
 * @n [Get the module here](http://www.dfrobot.com.cn/goods-1577.html)
 * @n This is the microbit special motor drive library, which realizes control
 *    of the eight-channel steering gear, two-step motor and four-way dc motor.
 *
 * @copyright	[DFRobot](http://www.dfrobot.com), 2016
 * @copyright	GNU Lesser General Public License
 *
 * @author [email](1035868977@qq.com)
 * @version  V1.0.7
 * @date  2018-03-20
 */

/**
 *This is DFRobot:motor user motor and steering control function.
 */
//% weight=10 color=#DF6721 icon="\uf040" block="Microturtle"
namespace motor {
    const PCA9685_ADDRESS = 0x40;
    const MODE1 = 0x00;
    const MODE2 = 0x01;
    const SUBADR1 = 0x02;
    const SUBADR2 = 0x03;
    const SUBADR3 = 0x04;
    const PRESCALE = 0xFE;
    const LED0_ON_L = 0x06;
    const LED0_ON_H = 0x07;
    const LED0_OFF_L = 0x08;
    const LED0_OFF_H = 0x09;
    const ALL_LED_ON_L = 0xFA;
    const ALL_LED_ON_H = 0xFB;
    const ALL_LED_OFF_L = 0xFC;
    const ALL_LED_OFF_H = 0xFD;

    const STP_CHA_L = 2047;
    const STP_CHA_H = 4095;

    const STP_CHB_L = 1;
    const STP_CHB_H = 2047;

    const STP_CHC_L = 1023;
    const STP_CHC_H = 3071;

    const STP_CHD_L = 3071;
    const STP_CHD_H = 1023;


    const BYG_CHA_L = 3071;
    const BYG_CHA_H = 1023;

    const BYG_CHB_L = 1023;
    const BYG_CHB_H = 3071;

    const BYG_CHC_L = 4095;
    const BYG_CHC_H = 2047;

    const BYG_CHD_L = 2047;
    const BYG_CHD_H = 4095;

    /**
     * The user can choose the step motor model.
     */
    enum Stepper {
        //% block="42"
        Ste1 = 1,
        //% block="28"
        Ste2 = 2
    }

    /**
     * The user can select the 8 steering gear controller.
     */
    enum Servos {
        S1 = 0x08,
        S2 = 0x07,
        S3 = 0x06,
        S4 = 0x05,
        S5 = 0x04,
        S6 = 0x03,
        S7 = 0x02,
        S8 = 0x01
    }

    /**
     * The user selects the 4-way dc motor.
     */
    enum Motors {
        M1 = 0x1,
        M2 = 0x2,
        M3 = 0x3,
        M4 = 0x4
    }

    /**
     * The user defines the motor rotation direction.
     */
    export enum Dir {
        //% blockId="CW" block="CW"
        CW = 1,
        //% blockId="CCW" block="CCW"
        CCW = -1,
    }
	
    export enum WheelsDirection {
        //% blockId="Forward" block="Forward"
        Forward = 1,
        //% blockId="Backward" block="Backward"
        Backward = -1,
    }

    export enum TurnDirection {
        //% blockId="Left" block="Left"
        Left = 1,
        //% blockId="Right" block="Right"
        Right = -1,
    }

    export enum PenPosition {
        //% blockId="Down" block="Down"
        Down = 1,
        //% blockId="Up" block="Up"
        Up = 2,
        //% blockId="Out" block="Out"
        Out = 3,
    }
	
    /**
     * The user can select a two-path stepper motor controller.
     */
    enum Steppers {
        M1_M2 = 0x1,
        M3_M4 = 0x2
    }



    let initialized = false;

    function i2cWrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = value;
        pins.i2cWriteBuffer(addr, buf);
    }

    function i2cCmd(addr: number, value: number) {
        let buf = pins.createBuffer(1);
        buf[0] = value;
        pins.i2cWriteBuffer(addr, buf);
    }

    function i2cRead(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
    }

    function initPCA9685(): void {
        i2cWrite(PCA9685_ADDRESS, MODE1, 0x00);
        setFreq(50);
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval;//Math.floor(prescaleval + 0.5);
        let oldmode = i2cRead(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cWrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cWrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }


    function setStepper_28(index: Steppers, direction: Dir): void {
        if (index == Steppers.M1_M2) {
            if (direction == Dir.CW) {
                setPwm(4, STP_CHA_L, STP_CHA_H);
                setPwm(6, STP_CHB_L, STP_CHB_H);
                setPwm(5, STP_CHC_L, STP_CHC_H);
                setPwm(7, STP_CHD_L, STP_CHD_H);
            } else {
                // CCW
                setPwm(7, STP_CHA_L, STP_CHA_H);
                setPwm(5, STP_CHB_L, STP_CHB_H);
                setPwm(6, STP_CHC_L, STP_CHC_H);
                setPwm(4, STP_CHD_L, STP_CHD_H);
            }
        } else {
            // M2-M3
            if (direction == Dir.CW) {
                setPwm(0, STP_CHA_L, STP_CHA_H);
                setPwm(2, STP_CHB_L, STP_CHB_H);
                setPwm(1, STP_CHC_L, STP_CHC_H);
                setPwm(3, STP_CHD_L, STP_CHD_H);
            } else {
                // CCW
                setPwm(3, STP_CHA_L, STP_CHA_H);
                setPwm(1, STP_CHB_L, STP_CHB_H);
                setPwm(2, STP_CHC_L, STP_CHC_H);
                setPwm(0, STP_CHD_L, STP_CHD_H);
            }
        }
    }



    /**
	 * Pen up and down
	*/
    //% blockId=motor_servo
    //% weight=50
    //% block="Servo %degree degree"
    //% degree.min=30 degree.max=155
    export function servo(degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // 50hz
        let v_us = (degree * 1800 / 180 + 600); // 0.6ms ~ 2.4ms
        let value = v_us * 4096 / 20000;
        setPwm(Servos.S1 + 7, 0, value);
    }


    //% weight=40
    //% blockId=motor_wheels block="Wheels %direction ms %ms"
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    //% ms.min=0 ms.max=10000
    export function wheels(direction: Dir, ms: number): void {
        if (!initialized) {
            initPCA9685()
        }
        setStepper_28(Steppers.M1_M2, direction);
        setStepper_28(Steppers.M3_M4, -direction);
        basic.pause(ms);
        motorStopAll();
    }

    //% weight=30
    //% blockId=motor_wheels_turn block="Turn wheels %direction ms %ms"
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    //% ms.min=0 ms.max=10000
    export function wheels_turn(direction: TurnDirection, ms: number): void {
        if (!initialized) {
            initPCA9685()
        }
        setStepper_28(Steppers.M1_M2, (direction === TurnDirection.Right) ? Dir.CCW : Dir.CW);
        setStepper_28(Steppers.M3_M4, (direction === TurnDirection.Right) ? Dir.CCW : Dir.CW);
        basic.pause(ms);
        motorStopAll();
    }

    //% weight=100
    //% blockId=motor_move block="Move %direction %ms cm"
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    //% ms.min=1 ms.max=20
    export function move(direction: WheelsDirection, cm: number): void {
        let ms = cm / 15.2 * 3000;  // Measured 15.2 cm in 3 seconds
        let dir = (direction === WheelsDirection.Forward) ? Dir.CCW : Dir.CW;
        wheels(dir, ms);
    }

    //% weight=90
    //% blockId=motor_turn block="Turn %direction %deg degrees"
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    //% deg.min=0 deg.max=360
    export function turn(direction: TurnDirection, deg: number): void {
        let ms = deg / 692 * 10000;  // Measured 692 degrees in 10 seconds
        wheels_turn(direction, ms);
    }

    //% weight=80
    //% blockId=motor_pen block="Pen %position"
    //% position.fieldEditor="gridpicker" direction.fieldOptions.columns=1
    export function pen(position: PenPosition): void {
        if (position === PenPosition.Out) {
            servo(30);
            basic.pause(2000);
            servo(80);
        } else {
            let degree;
            if (position === PenPosition.Up) {
                degree = 80;
            } else {
                // position === PenPosition.Down
                degree = 155;
            }
            servo(degree);
            basic.pause(500);
        }
    }

    function motorStop(index: Motors) {
        setPwm((4 - index) * 2, 0, 0);
        setPwm((4 - index) * 2 + 1, 0, 0);
    }


    function motorStopAll(): void {
        for (let idx = 1; idx <= 4; idx++) {
            motorStop(idx);
        }
    }
}

