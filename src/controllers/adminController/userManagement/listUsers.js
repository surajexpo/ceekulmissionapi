const { User } = require("../../../models/authModels");

const listUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      verificationStatus,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select(
          "name email phone verificationStatus status profileImage createdAt teacherProfile.bio teacherProfile.qualification"
        )
        .skip(skip)
        .limit(limitNum)
        .sort(sortOptions),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      status: true,
      users,
      pagination: {
        totalUsers,
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        pageSize: limitNum,
      },
    });
  } catch (err) {
    console.error("List Users Error:", err);
    res.status(500).json({
      status: false,
      message: "An error occurred while fetching users",
    });
  }
};

module.exports = listUsers;
