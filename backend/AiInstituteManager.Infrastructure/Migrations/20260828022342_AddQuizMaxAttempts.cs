using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiInstituteManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQuizMaxAttempts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxAttempts",
                table: "Quizzes",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxAttempts",
                table: "Quizzes");
        }
    }
}
