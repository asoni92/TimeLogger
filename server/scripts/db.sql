use certain_meeting_app;
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    IF NOT EXISTS( SELECT * FROM information_schema.tables WHERE table_schema = 'certain_meeting_app'  AND table_name = 'version'
LIMIT 1)  THEN
	CREATE TABLE `certain_meeting_app`.`version` (`ver_build` INT NOT NULL, `ver_version` VARCHAR(45) NULL,  UNIQUE INDEX `ver_build_UNIQUE` (`ver_build` ASC));
	END IF;
END $$
DELIMITER ;
CALL Alter_Table();

DROP PROCEDURE Alter_Table;

DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 1);
    IF _count = 0 THEN
        ALTER TABLE registration 
		CHANGE COLUMN position position VARCHAR(255) NULL DEFAULT NULL ;
        insert into version values (1, 'CMM-1');
    END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;

/*-------Add column isDefault in the table event--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 2);
    IF _count = 0 THEN
        ALTER TABLE `certain_meeting_app`.`event` 
ADD COLUMN `isDefault` TINYINT(1) NULL AFTER `timezone`;
        insert into version values (2, 'CMM-1');
    END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;

/*-------Add column mobile in the table registration--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 3);
    IF _count = 0 THEN
        ALTER TABLE `certain_meeting_app`.`registration` 
ADD COLUMN `mobile` VARCHAR(45) NULL AFTER `organization`;
        insert into version values (3, 'CMM-1');
    END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;

/*-------Add column isAllowed in the table attendee_type--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 4);
    IF _count = 0 THEN
ALTER TABLE `certain_meeting_app`.`attendee_type` 
ADD COLUMN `isAllowed` TINYINT(1) NOT NULL AFTER `active`;
        insert into version values (4, 'CMM-1');
    END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;

/*-------Add column isDefaultAttendeeType in the table attendee_type--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 5);
    IF _count = 0 THEN
ALTER TABLE `certain_meeting_app`.`attendee_type` 
ADD COLUMN `isDefaultAttendeeType` TINYINT(1) NULL AFTER `isAllowed`;
        insert into version values (5, 'CMM-1');
    END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;


/*-------Add config table--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 6);
    IF _count = 0 THEN
		CREATE TABLE `certain_meeting_app`.`config` (
  		`id` INT NOT NULL AUTO_INCREMENT,
		`portalId` INT NOT NULL,
		`eventId` INT NOT NULL,
		`type` VARCHAR(45) NOT NULL,
		`data` LONGTEXT NULL,
		PRIMARY KEY (`id`));
		insert into version values (6, 'CMM-1');
  END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;


/*------Change Type of AnswerLabel/AnswerCode/AnswerName to Text type in AnswerTable--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 7);
    IF _count = 0 THEN
		ALTER TABLE `certain_meeting_app`.`answer` 
		CHANGE COLUMN `answerName` `answerName` TEXT(1000) NOT NULL ,
		CHANGE COLUMN `answerLabel` `answerLabel` TEXT(1000) NOT NULL ,
		CHANGE COLUMN `answerCode` `answerCode` TEXT(1000) NOT NULL ;
		insert into version values (7, 'CMM-1');
  	END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;

/*------Change Type of QuestionLabel/QuestionCode/QuestionName to Text type in QuestionTable--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 8);
    IF _count = 0 THEN
		ALTER TABLE `certain_meeting_app`.`question` 
		CHANGE COLUMN `questionName` `questionName` TEXT(1000) NOT NULL ,
		CHANGE COLUMN `questionLabel` `questionLabel` TEXT(1000) NOT NULL ,
		CHANGE COLUMN `questionCode` `questionCode` TEXT(1000) NOT NULL ;
		insert into version values (8, 'CMM-1');
  	END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;


/*------Change Type of AnswerCode and Value to Text type in RegistrationAnswer Table--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 9);
    IF _count = 0 THEN
		ALTER TABLE `certain_meeting_app`.`registration_answer` 
		CHANGE COLUMN `answerCode` `answerCode` TEXT(1000) NULL DEFAULT NULL ,
		CHANGE COLUMN `value` `value` TEXT(1000) NULL DEFAULT NULL ;
		insert into version values (9, 'CMM-1');
  	END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;


/*------Adding indexes in Session, Session Location, Registration Session and Registration Table--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 10);
    IF _count = 0 THEN
		create index idx_session_cluster on session(eventId,locationCode); 
        create index idx_session_location_cluster on session_location(locationCode,eventId);
        create index idx_registration_session_cluster on registration_session(sessionId,isPublished,eventCode,accountCode);
        create index idx_registration_cluster on registration(registrationCode,eventCode,accountCode);
		insert into version values (10, 'CMM-1');
  	END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;

/*-------Add column sessionDescription in the table session--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 11);
    IF _count = 0 THEN
ALTER TABLE `certain_meeting_app`.`session` 
ADD COLUMN `sessionDescription` VARCHAR(255) NULL AFTER `abstractDesc`;
        insert into version values (11, 'CMM-1');
    END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;

/*-------Change type of column sessionDescription to TEXT in the table session--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 12);
    IF _count = 0 THEN
ALTER TABLE `certain_meeting_app`.`session` 
CHANGE COLUMN `sessionDescription` `sessionDescription` TEXT NULL DEFAULT NULL ;
        insert into version values (12, 'CMM-1');
    END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;

/*-------Adding isDefault column in session type table--------*/
DELIMITER $$
CREATE PROCEDURE Alter_Table()
BEGIN
    DECLARE _count INT;
    SET _count = (  SELECT COUNT(*) 
                    FROM version where ver_build = 13);
    IF _count = 0 THEN
ALTER TABLE `certain_meeting_app`.`session_type` 
ADD COLUMN `isDefault` TINYINT(1) NULL AFTER `portalId`;
        insert into version values (13, 'CMM-1');
    END IF;
END $$
DELIMITER ;
CALL Alter_Table();
DROP PROCEDURE Alter_Table;

















